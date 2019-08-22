const Validator = require('../../../common/validation/validator')

const keysErrors = {
  codeDuplicate: 'taxonomy.validationErrors.codeDuplicate',
  codeRequired: 'taxonomy.validationErrors.codeRequired',
  familyRequired: 'taxonomy.validationErrors.familyRequired',
  genusRequired: 'taxonomy.validationErrors.genusRequired',
  nameDuplicate: 'taxonomy.validationErrors.nameDuplicate',
  nameNotKeyword: 'taxonomy.validationErrors.nameNotKeyword',
  nameRequired: 'taxonomy.validationErrors.nameRequired',
  scientificNameDuplicate: 'taxonomy.validationErrors.scientificNameDuplicate',
  scientificNameRequired: 'taxonomy.validationErrors.scientificNameRequired',
  taxaEmpty: 'taxonomy.validationErrors.taxaEmpty',
}

/**
 * ====== TAXONOMY
 */
const validateNotEmptyTaxa = taxaCount => () =>
  taxaCount === 0 ? { key: keysErrors.taxaEmpty } : null

const taxonomyValidators = (taxonomies, taxaCount) => ({
  'props.name': [Validator.validateRequired(keysErrors.nameRequired), Validator.validateNotKeyword(keysErrors.nameNotKeyword),
    Validator.validateItemPropUniqueness(keysErrors.nameDuplicate)(taxonomies)],
  'taxa': [validateNotEmptyTaxa(taxaCount)]
})

const validateTaxonomy = async (taxonomies, taxonomy, taxaCount) =>
  await Validator.validate(taxonomy, taxonomyValidators(taxonomies, taxaCount))

/**
 * ====== TAXON
 */
const taxonValidators = (taxa) => ({
  'props.code': [Validator.validateRequired(keysErrors.codeRequired), Validator.validateItemPropUniqueness(keysErrors.codeDuplicate)(taxa)],
  'props.family': [Validator.validateRequired(keysErrors.familyRequired)],
  'props.genus': [Validator.validateRequired(keysErrors.genusRequired)],
  'props.scientificName': [Validator.validateRequired(keysErrors.scientificNameRequired), Validator.validateItemPropUniqueness(keysErrors.scientificNameDuplicate)(taxa)],
})

const validateTaxon = async (taxa, taxon) =>
  await Validator.validate(taxon, taxonValidators(taxa))

module.exports = {
  keysErrors,

  validateTaxonomy,
  validateTaxon,
}