const R = require('ramda')
const db = require('../db/db')
const fastcsv = require('fast-csv')

const {
  getTaxonCode,
  getTaxonFamily,
  getTaxonGenus,
  getTaxonScientificName
} = require('../../common/survey/taxonomy')

const {TaxaParser} = require('./taxaParser')

const {
  fetchTaxaByTaxonomyId,
  insertTaxa,
  deleteTaxaByTaxonomyId
} = require('../../server/taxonomy/taxonomyRepository')

const storeTaxa = async (surveyId, taxonomyId, taxa) => {
  await db.tx(async t => {
    await deleteTaxaByTaxonomyId(surveyId, taxonomyId, t)
    await insertTaxa(surveyId, taxa, t)
  })
}

const exportTaxa = async (surveyId, taxonomyId, output, draft = false) => {
  console.log('start csv export', draft)

  const csvStream = fastcsv.createWriteStream({headers: true})
  csvStream.pipe(output)

  //write header
  csvStream.write([
    'code',
    'family',
    'genus',
    'scientific_name'
  ])

  //write taxa
  const taxa = await fetchTaxaByTaxonomyId(surveyId, taxonomyId, null, 0, null, {
    field: 'scientificName',
    asc: true
  }, draft)

  taxa.forEach(taxon => {
    csvStream.write([
      getTaxonCode(taxon),
      getTaxonFamily(taxon),
      getTaxonGenus(taxon),
      getTaxonScientificName(taxon)
    ])
  })
  csvStream.end()
}

const importTaxa = async (surveyId, taxonomyId, inputBuffer) => {
  await new TaxaParser(taxonomyId, inputBuffer, async parseResult => {
    const hasErrors = !R.isEmpty(R.keys(parseResult.errors))

    if (hasErrors) {
      console.log('errors found')
    } else {
      await storeTaxa(surveyId, taxonomyId, parseResult.taxa)
      console.log(`taxa stored: ${parseResult.taxa.length}`)
    }
  }).start()
}

module.exports = {
  exportTaxa,
  importTaxa,
}