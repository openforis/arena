const {
  errorKeys,
  validate,
  validateRequired,
  validateItemPropUniqueness,
  validateNotKeyword
} = require('../../../common/validation/validator')

/**
 * ====== TAXONOMY
 */
const validateNotEmptyTaxa = taxaCount => () =>
  taxaCount === 0 ? { key: errorKeys.empty } : null

const taxonomyValidators = (taxonomies, taxaCount) => ({
  'props.name': [validateRequired, validateNotKeyword, validateItemPropUniqueness(taxonomies)],
  'taxa': [validateNotEmptyTaxa(taxaCount)]
})

const validateTaxonomy = async (taxonomies, taxonomy, taxaCount) =>
  await validate(taxonomy, taxonomyValidators(taxonomies, taxaCount))

/**
 * ====== TAXON
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