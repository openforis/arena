const R = require('ramda')
const db = require('../db/db')
const fastcsv = require('fast-csv')

const {publishSurveySchemaTableProps, markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')

const Taxonomy = require('../../common/survey/taxonomy')

const {createJob, updateJobProgress, updateJobStatus} = require('../job/jobManager')

const {jobStatus} = require('../../common/job/job')

const {TaxaParser} = require('./taxaParser')

const taxonomyRepository = require('../../server/taxonomy/taxonomyRepository')
const {validateTaxonomy} = require('./taxonomyValidator')

/**
 * ====== CREATE
 */
const createTaxonomy = async (surveyId, taxonomy) =>
  await taxonomyRepository.insertTaxonomy(surveyId, taxonomy)

const persistTaxa = async (surveyId, taxonomyId, vernacularLanguageCodes, taxa) => {
  await db.tx(async t => {
    await taxonomyRepository.updateTaxonomyProp(surveyId, taxonomyId, {
      key: 'vernacularLanguageCodes',
      value: vernacularLanguageCodes
    }, true, t)
    await taxonomyRepository.deleteTaxaByTaxonomyId(surveyId, taxonomyId, t)
    await taxonomyRepository.insertTaxa(surveyId, taxa, t)

    await markSurveyDraft(surveyId, t)
  })
}

const importTaxaJobName = 'import taxa'

const importTaxa = async (userId, surveyId, taxonomyId, inputBuffer) => {
  const importJob =
    await createJob(
      userId,
      surveyId,
      importTaxaJobName,
      //onCancel
      () => parser.cancel()
    )

  const parser = await new TaxaParser(taxonomyId, inputBuffer)
    .onStart(async event => await updateJobStatus(importJob.id, jobStatus.running, event.total, event.processed))
    .onProgress(async event => await updateJobProgress(importJob.id, event.total, event.processed))
    .onEnd(async event => {
      const result = event.result
      const hasErrors = !R.isEmpty(R.keys(result.errors))
      if (hasErrors) {
        console.log('errors found')
        await updateJobStatus(importJob.id, jobStatus.failed, event.total, event.processed, {errors: result.errors})
      } else {
        await persistTaxa(surveyId, taxonomyId, result.vernacularLanguageCodes, result.taxa)
        console.log(`taxa stored: ${result.taxa.length}`)
        await updateJobStatus(importJob.id, jobStatus.completed, event.total, event.processed)
      }
    })
    .start()

  return importJob
}

/**
 * ====== READ
 */
const fetchTaxonomiesBySurveyId = async (surveyId, draft = false, validate = false) => {
  const taxonomies = await taxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft)

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
  const taxonomy = await taxonomyRepository.fetchTaxonomyById(surveyId, taxonomyId, draft)

  if (validate) {
    const taxonomies = await taxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft)
    return {
      ...taxonomy,
      validation: await validateTaxonomy(taxonomies, taxonomy)
    }
  } else {
    return taxonomy
  }
}

const countTaxaByTaxonomyId = async (surveyId, taxonomyId, draft = false) =>
  await taxonomyRepository.countTaxaByTaxonomyId(surveyId, taxonomyId, draft)

const fetchTaxaByProp = async (surveyId, taxonomyId, filter, sort, limit, offset, draft) =>
  await taxonomyRepository.fetchTaxaByProp(surveyId, taxonomyId, filter, sort, limit, offset, draft)

const exportTaxa = async (surveyId, taxonomyId, output, draft = false) => {
  console.log('start csv export')

  const taxonomy = await taxonomyRepository.fetchTaxonomyById(surveyId, taxonomyId, draft)
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
  const taxa = await taxonomyRepository.fetchTaxaByProp(surveyId, taxonomyId, null, {
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
    const updatedTaxonomy = await taxonomyRepository.updateTaxonomyProp(surveyId, taxonomyId, key, value)

    await markSurveyDraft(surveyId, t)

    return updatedTaxonomy
  })

// ============== DELETE

const deleteTaxonomy = async (surveyId, taxonomyId) =>
  await db.tx(async t => {
    await taxonomyRepository.deleteTaxonomy(surveyId, taxonomyId)

    await markSurveyDraft(surveyId, t)
  })

module.exports = {
  //CREATE
  createTaxonomy,
  importTaxa,

  //READ
  fetchTaxonomyById,
  fetchTaxonomiesBySurveyId,
  exportTaxa,
  countTaxaByTaxonomyId,
  fetchTaxaByProp,

  //UPDATE
  publishTaxonomiesProps,
  updateTaxonomyProp,
  deleteTaxonomy
}