const {
  validate,
  validateRequired,
  valiateItemPropUniqueness
} = require('../../common/validation/validator')

/**
 * ====== TAXONOMY
 */
const taxonomyValidators = (taxonomies) => ({
  'props.name': [validateRequired, valiateItemPropUniqueness(taxonomies)],
})

const validateTaxonomy = async (taxonomies, taxonomy) =>
  await validate(taxonomy, taxonomyValidators(taxonomies))

/**
 * ====== TAXONOMY
 */
const taxonValidators = (taxa) => ({
  'props.family': [validateRequired],
  'props.genus': [validateRequired],
  'props.scientificName': [validateRequired, valiateItemPropUniqueness(taxa)],
  'props.code': [validateRequired, valiateItemPropUniqueness(taxa)],
})

const validateTaxon = async (taxa, taxon) =>
  await validate(taxon, taxonValidators(taxa))


module.exports = {
  validateTaxonomy,
  validateTaxon,
}