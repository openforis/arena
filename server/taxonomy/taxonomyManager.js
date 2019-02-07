const R = require('ramda')
const Promise = require('bluebird')
const fastcsv = require('fast-csv')

const db = require('../db/db')

const { publishSurveySchemaTableProps, markSurveyDraft } = require('../survey/surveySchemaRepositoryUtils')

const Taxonomy = require('../../common/survey/taxonomy')

const TaxonomyRepository = require('./taxonomyRepository')
const TaxonomyValidator = require('./taxonomyValidator')

const ActivityLog = require('../activityLog/activityLogger')

/**
 * ====== CREATE
 */
const createTaxonomy = async (user, surveyId, taxonomy) =>
  await db.tx(async t => {
    await ActivityLog.log(user, surveyId, ActivityLog.type.taxonomyCreate, taxonomy, t)

    return await validateTaxonomy(surveyId, [], await TaxonomyRepository.insertTaxonomy(surveyId, taxonomy))
  })

/**
 * ====== READ
 */
const fetchTaxonomiesBySurveyId = async (surveyId, draft = false, validate = false, client = db) => {
  const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft, client)

  return validate
    ? await Promise.all(
      taxonomies.map(async taxonomy => await validateTaxonomy(surveyId, taxonomies, taxonomy, client))
    )
    : taxonomies
}

const validateTaxonomy = async (surveyId, taxonomies = [], taxonomy, client = db) => {
  const taxaCount = await TaxonomyRepository.countTaxaByTaxonomyUuid(surveyId, taxonomy.uuid, client)

  return {
    ...taxonomy,
    validation: await TaxonomyValidator.validateTaxonomy(taxonomies, taxonomy, taxaCount)
  }
}

const fetchTaxonomyByUuid = async (surveyId, taxonomyUuid, draft = false, validate = false, client = db) => {
  const taxonomy = await TaxonomyRepository.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft, client)

  if (validate) {
    const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft, client)
    return await validateTaxonomy(surveyId, taxonomies, taxonomy, client)
  } else {
    return taxonomy
  }
}

const includeUnknownUnlistedItems = async (surveyId, taxonomyUuid, taxa, includeUnlUnk, draft) =>
  R.isEmpty(taxa) && includeUnlUnk
    ? [
      await fetchTaxonByCode(surveyId, taxonomyUuid, Taxonomy.unknownCode, draft),
      await fetchTaxonByCode(surveyId, taxonomyUuid, Taxonomy.unlistedCode, draft),
    ]
    : taxa

const fetchTaxaByPropLike = async (surveyId, taxonomyUuid, filterProp, filterValue, draft = false, includeUnlUnk = false) => {
  const taxaDb = await TaxonomyRepository.fetchTaxaByPropLike(surveyId, taxonomyUuid, filterProp, filterValue, draft)
  return includeUnknownUnlistedItems(surveyId, taxonomyUuid, taxaDb, includeUnlUnk, draft)
}

const fetchTaxaByVernacularName = async (surveyId, taxonomyUuid, filterValue, draft = false, includeUnlUnk = false) => {
  const taxaDb = await TaxonomyRepository.fetchTaxaByVernacularName(surveyId, taxonomyUuid, filterValue, draft)
  return includeUnknownUnlistedItems(surveyId, taxonomyUuid, taxaDb, includeUnlUnk, draft)
}

const fetchTaxonByCode = async (surveyId, taxonomyUuid, code, draft = false) => {
  const taxa = await TaxonomyRepository.fetchTaxaByPropLike(surveyId, taxonomyUuid, Taxonomy.taxonPropKeys.code, code, draft)
  return R.head(taxa)
}

const exportTaxa = async (surveyId, taxonomyUuid, output, draft = false) => {
  console.log('start csv export')

  const taxonomy = await TaxonomyRepository.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft)
  const vernacularLanguageCodes = Taxonomy.getTaxonomyVernacularLanguageCodes(taxonomy)

  const csvStream = fastcsv.createWriteStream({ headers: true })
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
  const taxa = await TaxonomyRepository.fetchAllTaxa(surveyId, taxonomyUuid, draft)

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

    await ActivityLog.log(user, surveyId, ActivityLog.type.taxonomyPropUpdate, { taxonomyUuid, key, value }, t)

    return updatedTaxonomy
  })

// ============== DELETE

const deleteTaxonomy = async (user, surveyId, taxonomyUuid) =>
  await db.tx(async t => {
    await TaxonomyRepository.deleteTaxonomy(surveyId, taxonomyUuid)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.taxonomyDelete, { taxonomyUuid }, t)
  })

const insertTaxa = (surveyId, taxa, user, client = db) => {
  const activities = taxa.map(taxon => ({
    type: ActivityLog.type.taxonInsert,
    params: taxon,
  }))

  return Promise.all([
    TaxonomyRepository.insertTaxa(surveyId, taxa, client),
    ActivityLog.logMany(user, surveyId, activities, client),
  ])
}

module.exports = {
  //CREATE
  createTaxonomy,
  insertTaxa,

  //READ
  fetchTaxonomyByUuid,
  fetchTaxonomiesBySurveyId,
  exportTaxa,
  countTaxaByTaxonomyUuid: TaxonomyRepository.countTaxaByTaxonomyUuid,
  fetchTaxaByPropLike,
  fetchTaxaByVernacularName,
  fetchTaxonByUuid: TaxonomyRepository.fetchTaxonByUuid,
  fetchTaxonByCode,
  fetchTaxonVernacularNameByUuid: TaxonomyRepository.fetchTaxonVernacularNameByUuid,
  fetchAllTaxa: TaxonomyRepository.fetchAllTaxa,

  //UPDATE
  publishTaxonomiesProps,
  updateTaxonomyProp,

  //DELETE
  deleteTaxonomy,
  deleteDraftTaxaByTaxonomyUuid: TaxonomyRepository.deleteDraftTaxaByTaxonomyUuid,
}