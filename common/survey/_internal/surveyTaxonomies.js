const R = require('ramda')

const taxonomies = 'taxonomies'

// ====== READ
const getSurveyTaxonomies = R.propOr({}, taxonomies)

const getTaxonomiesArray = R.pipe(getSurveyTaxonomies, R.values)

const getSurveyTaxonomyByUUID = uuid => R.pipe(getSurveyTaxonomies, R.prop(uuid))

// ====== UPDATE
const assocTaxonomies = newTaxonomies => R.assoc(taxonomies, newTaxonomies)

module.exports = {
  getSurveyTaxonomies,
  getTaxonomiesArray,
  getTaxonomyByUUID: getSurveyTaxonomyByUUID,

  assocTaxonomies,
}