const Validator = require('../../../common/validation/validator')
const ValidatorErrorKeys = require('../../../common/validation/validatorErrorKeys')

/**
 * ====== TAXONOMY
 */
const validateNotEmptyTaxa = taxaCount => () =>
  taxaCount === 0 ? { key: ValidatorErrorKeys.taxonomyEdit.taxaEmpty } : null

const taxonomyValidators = (taxonomies, taxaCount) => ({
  'props.name': [
    Validator.validateRequired(ValidatorErrorKeys.nameRequired),
    Validator.validateNotKeyword(ValidatorErrorKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(ValidatorErrorKeys.nameDuplicate)(taxonomies)
  ],
  'taxa': [validateNotEmptyTaxa(taxaCount)]
})

const validateTaxonomy = async (taxonomies, taxonomy, taxaCount) =>
  await Validator.validate(taxonomy, taxonomyValidators(taxonomies, taxaCount))

/**
 * ====== TAXON
 */
const taxonValidators = (taxa) => ({
  'props.code': [
    Validator.validateRequired(ValidatorErrorKeys.taxonomyEdit.codeRequired),
    Validator.validateItemPropUniqueness(ValidatorErrorKeys.taxonomyEdit.codeDuplicate)(taxa)
  ],
  'props.family': [Validator.validateRequired(ValidatorErrorKeys.taxonomyEdit.familyRequired)],
  'props.genus': [Validator.validateRequired(ValidatorErrorKeys.taxonomyEdit.genusRequired)],
  'props.scientificName': [
    Validator.validateRequired(ValidatorErrorKeys.taxonomyEdit.scientificNameRequired),
    Validator.validateItemPropUniqueness(ValidatorErrorKeys.taxonomyEdit.scientificNameDuplicate)(taxa)
  ],
})

const validateTaxon = async (taxa, taxon) =>
  await Validator.validate(taxon, taxonValidators(taxa))

module.exports = {
  validateTaxonomy,
  validateTaxon,
}