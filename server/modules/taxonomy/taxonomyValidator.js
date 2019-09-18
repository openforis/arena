const Taxonomy = require('../../../common/survey/taxonomy')
const Taxon = require('../../../common/survey/taxon')
const Validator = require('../../../common/validation/validator')
const ObjectUtils = require('../../../common/objectUtils')

/**
 * ====== TAXONOMY
 */
const validateNotEmptyTaxa = taxaCount => () =>
  taxaCount === 0 ? { key: Validator.messageKeys.taxonomyEdit.taxaEmpty } : null

const taxonomyValidators = (taxonomies, taxaCount) => ({
  [`${ObjectUtils.keys.props}.${Taxonomy.keysProps.name}`]: [
    Validator.validateRequired(Validator.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validator.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validator.messageKeys.nameDuplicate)(taxonomies)
  ],
  'taxa': [validateNotEmptyTaxa(taxaCount)]
})

const validateTaxonomy = async (taxonomies, taxonomy, taxaCount) =>
  await Validator.validate(taxonomy, taxonomyValidators(taxonomies, taxaCount))

/**
 * ====== TAXON
 */
const taxonValidators = (taxa) => ({
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.code}`]: [
    Validator.validateRequired(Validator.messageKeys.taxonomyEdit.codeRequired),
    Validator.validateItemPropUniqueness(Validator.messageKeys.taxonomyEdit.codeDuplicate)(taxa)
  ],
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.family}`]: [Validator.validateRequired(Validator.messageKeys.taxonomyEdit.familyRequired)],
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.genus}`]: [Validator.validateRequired(Validator.messageKeys.taxonomyEdit.genusRequired)],
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.scientificName}`]: [
    Validator.validateRequired(Validator.messageKeys.taxonomyEdit.scientificNameRequired),
    Validator.validateItemPropUniqueness(Validator.messageKeys.taxonomyEdit.scientificNameDuplicate)(taxa)
  ],
})

const validateTaxon = async (taxa, taxon) =>
  await Validator.validate(taxon, taxonValidators(taxa))

module.exports = {
  validateTaxonomy,
  validateTaxon,
}