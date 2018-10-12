const R = require('ramda')
const db = require('../db/db')
const fastcsv = require('fast-csv')

const {
  getTaxonomyVernacularLanguageCodes,
  getTaxonCode,
  getTaxonFamily,
  getTaxonGenus,
  getTaxonScientificName,
  getTaxonVernacularName,
} = require('../../common/survey/taxonomy')

const {
  createJob,
  updateJobProgress,
  updateJobStatus,
} = require('../job/jobManager')

const {
  jobStatus
} = require('../../common/job/job')

const {TaxaParser} = require('./taxaParser')

const {
  fetchTaxonomyById,
  fetchTaxa,
  insertTaxa,
  updateTaxonomyProp,
  deleteTaxaByTaxonomyId
} = require('../../server/taxonomy/taxonomyRepository')

const storeTaxa = async (surveyId, taxonomyId, vernacularLanguageCodes, taxa) => {
  await db.tx(async t => {
    await updateTaxonomyProp(surveyId, taxonomyId, {
      key: 'vernacularLanguageCodes',
      value: vernacularLanguageCodes
    }, true, t)
    await deleteTaxaByTaxonomyId(surveyId, taxonomyId, t)
    await insertTaxa(surveyId, taxa, t)
  })
}

const exportTaxa = async (surveyId, taxonomyId, output, draft = false) => {
  console.log('start csv export')

  const taxonomy = await fetchTaxonomyById(surveyId, taxonomyId, draft)
  const vernacularLanguageCodes = getTaxonomyVernacularLanguageCodes(taxonomy)

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
  const taxa = await fetchTaxa(surveyId, taxonomyId, null, 0, null, {
    field: 'scientificName',
    asc: true
  }, draft)

  taxa.forEach(taxon => {
    csvStream.write(R.concat([
        getTaxonCode(taxon),
        getTaxonFamily(taxon),
        getTaxonGenus(taxon),
        getTaxonScientificName(taxon)
      ],
      R.map(langCode => getTaxonVernacularName(langCode)(taxon))(vernacularLanguageCodes)
    ))
  })
  csvStream.end()

  console.log('csv export completed')
}

const importTaxa = async (surveyId, taxonomyId, inputBuffer) => {
  const importJob = await createJob(surveyId, 'import taxa')

  await new TaxaParser(taxonomyId, inputBuffer)
    .onStart(async () => console.log('started') || await updateJobStatus(surveyId, importJob.id, jobStatus.running))
    .onProgress(async event => console.log('updating') || await updateJobProgress(surveyId, importJob.id, event.progressPercent))
    .onEnd(async parseResult => {
      console.log('completed')

      const hasErrors = !R.isEmpty(R.keys(parseResult.errors))
      if (hasErrors) {
        console.log('errors found')
        await updateJobStatus(surveyId, importJob.id, jobStatus.error)
      } else {
        await storeTaxa(surveyId, taxonomyId, parseResult.vernacularLanguageCodes, parseResult.taxa)
        console.log(`taxa stored: ${parseResult.taxa.length}`)
        await updateJobStatus(surveyId, importJob.id, jobStatus.completed)
      }
    })
    .start()

  return importJob
}

module.exports = {
  exportTaxa,
  importTaxa,
}