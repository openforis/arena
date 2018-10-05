const R = require('ramda')

const {validate, validateRequired} = require('../../common/validation/validator')
const {getTaxonomyName} = require('../../common/survey/taxonomy')

const taxonomyValidators = (taxonomies) => ({
  'props.name': [validateRequired, validateTaxonomyNameUniqueness(taxonomies)],
})

const validateTaxonomyNameUniqueness = taxonomies =>
  (propName, taxonomy) => {

    const hasDuplicates = R.any(
      t => getTaxonomyName(t) === getTaxonomyName(taxonomy) && t.id !== taxonomy.id,
      taxonomies
    )
    return hasDuplicates
      ? 'duplicate'
      : null
  }

const validateTaxonomy = async (taxonomies, taxonomy) =>
  await validate(taxonomy, taxonomyValidators(taxonomies))

module.exports = {
  validateTaxonomy,
}