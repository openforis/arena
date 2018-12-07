const R = require('ramda')
const fastcsv = require('fast-csv')

const db = require('../db/db')

const {publishSurveySchemaTableProps, markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')

const Taxonomy = require('../../common/survey/taxonomy')

const TaxonomyRepository = require('./taxonomyRepository')
const TaxonomyValidator = require('./taxonomyValidator')

const {logActivity, logActivities, activityType} = require('../activityLog/activityLogger')

/**
 * ====== CREATE
 */
const createTaxonomy = async (user, surveyId, taxonomy) =>
  await db.tx(async t => {
    await logActivity(user, surveyId, activityType.taxonomy.create, taxonomy, t)

    return await validateTaxonomy(surveyId, [], await TaxonomyRepository.insertTaxonomy(surveyId, taxonomy))
  })

/**
 * ====== READ
 */
const fetchTaxonomiesBySurveyId = async (surveyId, draft = false, validate = false) => {
  const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft)

  return validate
    ? await Promise.all(
      taxonomies.map(async taxonomy => await validateTaxonomy(surveyId, taxonomies, taxonomy))
    )
    : taxonomies
}

const validateTaxonomy = async (surveyId, taxonomies = [], taxonomy, client = db) => {
  const taxaCount = await TaxonomyRepository.countTaxaByTaxonomyId(surveyId, taxonomy.id, client)

  return {
    ...taxonomy,
    validation: await TaxonomyValidator.validateTaxonomy(taxonomies, taxonomy, taxaCount)
  }
}

const fetchTaxonomyById = async (surveyId, taxonomyId, draft = false, validate = false, client = db) => {
  const taxonomy = await TaxonomyRepository.fetchTaxonomyById(surveyId, taxonomyId, draft, client)

  if (validate) {
    const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft, client)
    return await validateTaxonomy(surveyId, taxonomies, taxonomy, client)
  } else {
    return taxonomy
  }
}

const exportTaxa = async (surveyId, taxonomyId, output, draft = false) => {
  console.log('start csv export')

  const taxonomy = await TaxonomyRepository.fetchTaxonomyById(surveyId, taxonomyId, draft)
  const vernacularLanguageCodes = Taxonomy.getTaxonomyVernacularLanguageCodes(taxonomy)

  const csvStream = fastcsv.createWriteStream({headers: true})
  csvStream.pipe(output)

  const fixedHeaders = [
    'code',
    'family',
    'genus',
    'scientific_name'
  ]
  //write headers
  csvStream.write(R.concat(fixedHeaders, vernacularLanguageCodes))

  //write taxa
  const taxa = await TaxonomyRepository.fetchTaxaByPropLike(surveyId, taxonomyId, null, draft)

  taxa.forEach(taxon => {
    csvStream.write(R.concat([
        Taxonomy.getTaxonCode(taxon),
        Taxonomy.getTaxonFamily(taxon),
        Taxonomy.getTaxonGenus(taxon),
        Taxonomy.getTaxonScientificName(taxon)
      ],
      R.map(langCode => Taxonomy.getTaxonVernacularName(langCode)(taxon))(vernacularLanguageCodes)
    ))
  })
  csvStream.end()

  console.log('csv export completed')
}

// ====== UPDATE

const publishTaxonomiesProps = async (surveyId, client = db) => {
  await publishSurveySchemaTableProps(surveyId, 'taxonomy', client)
  await publishSurveySchemaTableProps(surveyId, 'taxon', client)
  await publishSurveySchemaTableProps(surveyId, 'taxon_vernacular_name', client)
}

const updateTaxonomyProp = async (user, surveyId, taxonomyUuid, key, value, client = db) =>
  await client.tx(async t => {
    const updatedTaxonomy = await TaxonomyRepository.updateTaxonomyProp(surveyId, taxonomyUuid, key, value)

    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, activityType.taxonomy.propUpdate, {taxonomyUuid, key, value}, t)

    return updatedTaxonomy
  })

// ============== DELETE

const deleteTaxonomy = async (user, surveyId, taxonomyUuid) =>
  await db.tx(async t => {
    await TaxonomyRepository.deleteTaxonomy(surveyId, taxonomyUuid)

    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, activityType.taxonomy.delete, {taxonomyUuid}, t)
  })

const insertTaxa = (user, surveyId, taxa, client = db) => {
  const activities = taxa.map(taxon => ({
    type: activityType.taxonomy.taxonInsert,
    params: taxon,
  }))

  return Promise.all([
    TaxonomyRepository.insertTaxa(surveyId, taxa, client),
    logActivities(user, surveyId, activities, client),
  ])
}

module.exports = {
  //CREATE
  createTaxonomy,
  insertTaxa,

  //READ
  fetchTaxonomyById,
  fetchTaxonomiesBySurveyId,
  exportTaxa,
  countTaxaByTaxonomyId: TaxonomyRepository.countTaxaByTaxonomyId,
  fetchTaxaByPropLike: TaxonomyRepository.fetchTaxaByPropLike,

  //UPDATE
  publishTaxonomiesProps,
  updateTaxonomyProp,

  //DELETE
  deleteTaxonomy,
  deleteDraftTaxaByTaxonomyId: TaxonomyRepository.deleteDraftTaxaByTaxonomyId,
}