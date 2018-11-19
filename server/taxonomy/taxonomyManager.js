const R = require('ramda')
const fastcsv = require('fast-csv')

const db = require('../db/db')

const {publishSurveySchemaTableProps, markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')

const Taxonomy = require('../../common/survey/taxonomy')

const TaxonomyRepository = require('./taxonomyRepository')
const {validateTaxonomy} = require('./taxonomyValidator')

/**
 * ====== CREATE
 */
const createTaxonomy = async (surveyId, taxonomy) =>
  await TaxonomyRepository.insertTaxonomy(surveyId, taxonomy)

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

const fetchTaxonomyById = async (surveyId, taxonomyId, draft = false, validate = false, client = db) => {
  const taxonomy = await TaxonomyRepository.fetchTaxonomyById(surveyId, taxonomyId, draft, client)

  if (validate) {
    const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft, client)
    return {
      ...taxonomy,
      validation: await validateTaxonomy(taxonomies, taxonomy)
    }
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

const updateTaxonomyProp = async (surveyId, taxonomyId, key, value, client = db) =>
  await client.tx(async t => {
    const updatedTaxonomy = await TaxonomyRepository.updateTaxonomyProp(surveyId, taxonomyId, key, value)

    await markSurveyDraft(surveyId, t)

    return updatedTaxonomy
  })

const saveTaxa = async (surveyId, taxa, client = db) =>
  await client.tx(async t => {
    taxa.map(async taxon => {
      const taxonDb = await TaxonomyRepository.insertOrUpdateTaxon(surveyId, taxon, t)
      await TaxonomyRepository.insertOrUpdateVernacularNames(surveyId, taxonDb.uuid, Taxonomy.getTaxonVernacularNames(taxon), t)
    })
    await markSurveyDraft(surveyId, t)
  })

const checkPublishedTaxonNotUpdated = async (surveyId, newTaxon, t) => {
  const oldTaxon = await TaxonomyRepository.fetchTaxonByCode(surveyId, newTaxon.taxonomyId, Taxonomy.getTaxonCode(newTaxon), true, t)
  if (oldTaxon && oldTaxon.published) {
    if (Taxonomy.getTaxonScientificName(oldTaxon) !== Taxonomy.getTaxonScientificName(newTaxon)) {
      return false
    }
    const oldVernacularNames = await TaxonomyRepository.fetchTaxonVernacularNames(surveyId, oldTaxon.uuid, true, t)

    const newVernacularNames = Taxonomy.getTaxonVernacularNames(newTaxon)
    if (oldVernacularNames && (
      //vernacular names removed
      !R.isEmpty(R.difference(R.keys(oldVernacularNames), R.keys(newVernacularNames)))
      ||
      //vernacular names changed
      R.any(langCode => {
        const oldVernacularName = oldVernacularNames[langCode]
        return oldVernacularName && oldVernacularName !== newVernacularNames[langCode]
      })(R.keys(newVernacularNames))
    )) {
      return false
    }
  }
  return true
}

const saveTaxon = async (surveyId, taxon, client = db) =>
  await client.tx(async t => {
    if (checkPublishedTaxonNotUpdated(surveyId, taxon, t)) {
      const taxonDb = await TaxonomyRepository.insertOrUpdateTaxon(surveyId, taxon, t)
      const newVernacularNames = Taxonomy.getTaxonVernacularNames(taxon)
      if (newVernacularNames) {
        await TaxonomyRepository.insertOrUpdateVernacularNames(surveyId, taxonDb.uuid, newVernacularNames, t)
      }
      return taxonDb
    } else {
      throw new Error('cannot modify published taxon properties')
    }
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
  insertTaxa: TaxonomyRepository.insertTaxa,

  //READ
  fetchTaxonomyById,
  fetchTaxonomiesBySurveyId,
  exportTaxa,
  countTaxaByTaxonomyId: TaxonomyRepository.countTaxaByTaxonomyId,
  fetchTaxaByPropLike: TaxonomyRepository.fetchTaxaByPropLike,

  //UPDATE
  publishTaxonomiesProps,
  updateTaxonomyProp,
  saveTaxa,
  saveTaxon,

  //DELETE
  deleteTaxonomy,
  deleteDraftTaxaByTaxonomyId: TaxonomyRepository.deleteDraftTaxaByTaxonomyId,
}