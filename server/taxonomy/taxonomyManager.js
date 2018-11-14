const R = require('ramda')
const db = require('../db/db')
const fastcsv = require('fast-csv')

const {publishSurveySchemaTableProps, markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')

const Taxonomy = require('../../common/survey/taxonomy')

const TaxonomyRepository = require('./taxonomyRepository')
const {validateTaxonomy} = require('./taxonomyValidator')

/**
 * ====== CREATE
 */
const createTaxonomy = async (surveyId, taxonomy) =>
  await TaxonomyRepository.insertTaxonomy(surveyId, taxonomy)

const persistTaxa = async (surveyId, taxonomyId, taxa, vernacularLanguageCodes) => {
  await db.tx(async t => {
    await TaxonomyRepository.updateTaxonomyProp(surveyId, taxonomyId, {
      key: 'vernacularLanguageCodes',
      value: vernacularLanguageCodes
    }, true, t)
    await TaxonomyRepository.deleteTaxaByTaxonomyId(surveyId, taxonomyId, t)
    await TaxonomyRepository.insertTaxa(surveyId, taxa, t)

    await markSurveyDraft(surveyId, t)
  })
}

/**
 * ====== READ
 */
const fetchTaxonomiesBySurveyId = async (surveyId, draft = false, validate = false) => {
  const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft)

  return validate
    ? await Promise.all(
      taxonomies.map(async taxonomy => ({
          ...taxonomy,
          validation: await validateTaxonomy(taxonomies, taxonomy)
        })
      )
    )
    : taxonomies
}

const fetchTaxonomyById = async (surveyId, taxonomyId, draft = false, validate = false) => {
  const taxonomy = await TaxonomyRepository.fetchTaxonomyById(surveyId, taxonomyId, draft)

  if (validate) {
    const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft)
    return {
      ...taxonomy,
      validation: await validateTaxonomy(taxonomies, taxonomy)
    }
  } else {
    return taxonomy
  }
}

const countTaxaByTaxonomyId = async (surveyId, taxonomyId, draft = false) =>
  await TaxonomyRepository.countTaxaByTaxonomyId(surveyId, taxonomyId, draft)

const fetchTaxaByProp = async (surveyId, taxonomyId, filter, sort, limit, offset, draft) =>
  await TaxonomyRepository.fetchTaxaByProp(surveyId, taxonomyId, filter, sort, limit, offset, draft)

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
  const taxa = await TaxonomyRepository.fetchTaxaByProp(surveyId, taxonomyId, null, {
    field: 'scientificName',
    asc: true
  }, null, null, draft)

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

const updateTaxonomyProp = async (surveyId, taxonomyId, key, value) =>
  await db.tx(async t => {
    const updatedTaxonomy = await TaxonomyRepository.updateTaxonomyProp(surveyId, taxonomyId, key, value)

    await markSurveyDraft(surveyId, t)

    return updatedTaxonomy
  })

// ============== DELETE

const deleteTaxonomy = async (surveyId, taxonomyId) =>
  await db.tx(async t => {
    await TaxonomyRepository.deleteTaxonomy(surveyId, taxonomyId)

    await markSurveyDraft(surveyId, t)
  })

module.exports = {
  //CREATE
  createTaxonomy,

  //READ
  fetchTaxonomyById,
  fetchTaxonomiesBySurveyId,
  exportTaxa,
  countTaxaByTaxonomyId,
  fetchTaxaByProp,

  //UPDATE
  persistTaxa,
  publishTaxonomiesProps,
  updateTaxonomyProp,
  deleteTaxonomy
}