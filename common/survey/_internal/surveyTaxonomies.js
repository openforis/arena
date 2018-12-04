const R = require('ramda')

const taxonomies = 'taxonomies'

// ====== READ
const getTaxonomies = R.propOr({}, taxonomies)

const getTaxonomiesArray = R.pipe(getTaxonomies, R.values)

const getTaxonomyByUuid = uuid => R.pipe(getTaxonomies, R.prop(uuid))

// ====== UPDATE
const assocTaxonomies = newTaxonomies => R.assoc(taxonomies, newTaxonomies)

module.exports = {
  getTaxonomies,
  getTaxonomiesArray,
  getTaxonomyByUuid,

  assocTaxonomies,
}