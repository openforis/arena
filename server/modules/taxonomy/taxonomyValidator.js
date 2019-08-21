const {
  validate,
  validateRequired,
  validateItemPropUniqueness,
  validateNotKeyword
} = require('../../../common/validation/validator')

const keysErrors = {
  taxaEmpty: 'taxonomy.validationErrors.taxaEmpty',
  duplicateCode: 'taxonomy.validationErrors.duplicateCode',
  duplicateScientificName: 'taxonomy.validationErrors.duplicateScientificName'
}

/**
 * ====== TAXONOMY
 */
const validateNotEmptyTaxa = taxaCount => () =>
  taxaCount === 0 ? { key: keysErrors.taxaEmpty } : null

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
  keysErrors,

  validateTaxonomy,
  validateTaxon,
}