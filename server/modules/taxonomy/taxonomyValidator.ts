import type { Taxon as ArenaTaxon, Taxonomy as ArenaTaxonomy } from '@openforis/arena-core'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as ObjectUtils from '@core/objectUtils'

// ====== TAXONOMY

const validateNotEmptyTaxa = (taxaCount: any) => () =>
  taxaCount === 0 ? { key: Validation.messageKeys.taxonomyEdit.taxaEmpty } : null

const taxonomyValidators = (taxonomies: any, taxaCount: any) => ({
  [`${ObjectUtils.keys.props}.${Taxonomy.keysProps.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    Validator.validateName(Validation.messageKeys.nameInvalid),
    Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(taxonomies),
  ],
  taxa: [validateNotEmptyTaxa(taxaCount)],
})

export const validateTaxonomy = (taxonomies: any, taxonomy: ArenaTaxonomy, taxaCount: any) =>
  Validator.validate(taxonomy, taxonomyValidators(taxonomies, taxaCount))

// ====== TAXON

const _validateVernacularNames = (_: any, taxon: ArenaTaxon) => {
  const vernacularNamesByLang = Taxon.getVernacularNames(taxon)
  const vernacularNamesDuplicate = Object.values(vernacularNamesByLang).reduce(
    (duplicatesAcc, vernacularNamesPerLang) => {
      const duplicate = vernacularNamesPerLang.find((vernacularName, index) =>
        vernacularNamesPerLang.find(
          (vernacularName2, index2) =>
            TaxonVernacularName.getName(vernacularName) === TaxonVernacularName.getName(vernacularName2) &&
            index !== index2
        )
      )
      if (duplicate) {
        duplicatesAcc.push(duplicate)
      }
      return duplicatesAcc
    },
    []
  )
  if (vernacularNamesDuplicate.length) {
    const vernacularNameDuplicate = vernacularNamesDuplicate[0]
    return ValidationResult.newInstance(Validation.messageKeys.taxonomyEdit.vernacularNamesDuplicate, {
      name: TaxonVernacularName.getName(vernacularNameDuplicate),
      lang: TaxonVernacularName.getLang(vernacularNameDuplicate),
    })
  }
  return null
}

const taxonValidators = (taxa: ArenaTaxon[]) => ({
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.code}`]: [
    Validator.validateRequired(Validation.messageKeys.taxonomyEdit.codeRequired),
    Validator.validateItemPropUniqueness(Validation.messageKeys.taxonomyEdit.codeDuplicate)(taxa),
  ],
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.family}`]: [
    Validator.validateRequired(Validation.messageKeys.taxonomyEdit.familyRequired),
  ],
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.genus}`]: [
    Validator.validateRequired(Validation.messageKeys.taxonomyEdit.genusRequired),
  ],
  [`${ObjectUtils.keys.props}.${Taxon.propKeys.scientificName}`]: [
    Validator.validateRequired(Validation.messageKeys.taxonomyEdit.scientificNameRequired),
    Validator.validateItemPropUniqueness(Validation.messageKeys.taxonomyEdit.scientificNameDuplicate)(taxa),
  ],
  [Taxon.keys.vernacularNames]: [_validateVernacularNames],
})

export const validateTaxon = (taxa: ArenaTaxon[], taxon: ArenaTaxon) => Validator.validate(taxon, taxonValidators(taxa))
