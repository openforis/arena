const {
  validate,
  validateRequired,
  validateItemPropUniqueness
} = require('../../common/validation/validator')

/**
 * ====== TAXONOMY
 */
const taxonomyValidators = (taxonomies) => ({
  'props.name': [validateRequired, validateItemPropUniqueness(taxonomies)],
})

const validateTaxonomy = async (taxonomies, taxonomy) =>
  await validate(taxonomy, taxonomyValidators(taxonomies))

/**
 * ====== TAXONOMY
 */
const taxonValidators = (taxa) => ({
  'props.family': [validateRequired],
  'props.genus': [validateRequired],
  'props.scientificName': [validateRequired, validateItemPropUniqueness(taxa)],
  'props.code': [validateRequired, validateItemPropUniqueness(taxa)],
})

const validateTaxon = async (taxa, taxon) =>
  await validate(taxon, taxonValidators(taxa))

module.exports = {
  validateTaxonomy,
  validateTaxon,
}