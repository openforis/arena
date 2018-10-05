const R = require('ramda')
const db = require('../db/db')

const {TaxaParser} = require('./taxaParser')

const {insertTaxa, deleteTaxaByTaxonomyId} = require('../../server/taxonomy/taxonomyRepository')

const storeTaxa = async (surveyId, taxonomyId, taxa) => {
  await db.tx(async t => {
    await deleteTaxaByTaxonomyId(surveyId, taxonomyId, t)
    await insertTaxa(surveyId, taxa, t)
  })
}

const importTaxa = async (surveyId, taxonomyId, inputBuffer) => {
  await new TaxaParser(taxonomyId, inputBuffer, async parseResult => {
    const hasErrors = !R.isEmpty(R.keys(parseResult.errors))

    if (hasErrors) {
      console.log('errors', R.keys(parseResult.errors).length, parseResult.errors)
    } else {
      await storeTaxa(surveyId, taxonomyId, parseResult.taxa)
      console.log('inserted taxa', parseResult.taxa.length)
    }
  }).start()
}

module.exports = {
  importTaxa,
}