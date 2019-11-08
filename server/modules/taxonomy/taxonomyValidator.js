import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'

/**
 * ====== TAXONOMY
 */
const validateNotEmptyTaxa = taxaCount => () =>
  taxaCount === 0 ? { key: Validation.messageKeys.taxonomyEdit.taxaEmpty } : null

const taxonomyValidators = (taxonomies, taxaCount) => ({
  [`${ObjectUtils.keys.props}.${Taxonomy.keysProps.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(taxonomies)
  ],
  'taxa': [validateNotEmptyTaxa(taxaCount)]
})

export const validateTaxonomy = async (taxonomies, taxonomy, taxaCount) =>
  await Validator.validate(taxonomy, taxonomyValidators(taxonomies, taxaCount))

/**
 * ====== TAXON
 */
const taxonValidators = (taxa) => ({
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.code}`]: [
    Validator.validateRequired(Validation.messageKeys.taxonomyEdit.codeRequired),
    Validator.validateItemPropUniqueness(Validation.messageKeys.taxonomyEdit.codeDuplicate)(taxa)
  ],
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.family}`]: [Validator.validateRequired(Validation.messageKeys.taxonomyEdit.familyRequired)],
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.genus}`]: [Validator.validateRequired(Validation.messageKeys.taxonomyEdit.genusRequired)],
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.scientificName}`]: [
    Validator.validateRequired(Validation.messageKeys.taxonomyEdit.scientificNameRequired),
    Validator.validateItemPropUniqueness(Validation.messageKeys.taxonomyEdit.scientificNameDuplicate)(taxa)
  ],
})

export const validateTaxon = async (taxa, taxon) =>
  await Validator.validate(taxon, taxonValidators(taxa))
