import * as A from '@core/arena'
import type { ExtraPropDefItem } from '@core/survey/extraPropDef'

import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'

import * as StringUtils from '@core/stringUtils'

import * as TaxonomyValidator from '../taxonomyValidator'

export default class TaxonCSVParser {
  // extra prop defs, with the CSV column header of each one
  extraPropsDefs: Record<string, ExtraPropDefItem & { key: string; originalHeader: string }>
  processedRow: number
  rowsByField: Record<string, Record<string, number>>
  taxonomyUuid: string
  vernacularLanguageCodes: string[]

  constructor({ taxonomyUuid, vernacularLanguageCodes, extraPropsDefs }) {
    this.taxonomyUuid = taxonomyUuid
    this.vernacularLanguageCodes = vernacularLanguageCodes
    this.extraPropsDefs = extraPropsDefs

    this.processedRow = 0
    this.rowsByField = {
      [Taxon.propKeys.code]: {}, // Maps codes to csv file rows
      [Taxon.propKeys.scientificName]: {}, // Maps scientific names to csv file rows
    }
  }

  async parseTaxon(row) {
    const { family: familyRow, genus: genusRow, scientific_name: scientificName, code, ...otherProps } = row

    const family = familyRow || 'no_data'

    // the genus is always the first word of the scientific name
    const genus = genusRow ?? (scientificName ? scientificName.split(' ')[0] : null)

    const taxonNew = Taxon.newTaxon({
      taxonomyUuid: this.taxonomyUuid,
      code: String(StringUtils.nullToEmpty(code)),
      family,
      genus,
      scientificName,
      vernacularNames: this._parseVernacularNames(otherProps),
      extra: this._parseExtraProps(otherProps),
    })
    const taxon = Taxon.setProp(Taxon.propKeys.position, this.processedRow)(taxonNew)

    const validation = await this._validateTaxon(taxon)

    this.processedRow += 1

    return { ...taxon, validation }
  }

  async _validateTaxon(taxon) {
    const validation = await TaxonomyValidator.validateTaxon([], taxon) // Do not validate code and scientific name uniqueness

    // validate taxon uniqueness among inserted values
    if (Validation.isValid(validation)) {
      const code = A.pipe(Taxon.getCode, A.toString, A.toUpper)(taxon)
      this._addValueToIndex(Taxon.propKeys.code, code, Validation.messageKeys.taxonomyEdit.codeDuplicate, validation)

      const scientificName = Taxon.getScientificName(taxon)
      this._addValueToIndex(
        Taxon.propKeys.scientificName,
        scientificName,
        Validation.messageKeys.taxonomyEdit.scientificNameDuplicate,
        validation
      )
    }

    return validation
  }

  _addValueToIndex(field, value, errorKeyDuplicate, validation) {
    const duplicateRow = this.rowsByField[field][value]
    if (duplicateRow) {
      A.pipe(
        Validation.setValid(false),
        Validation.setField(
          field,
          Validation.newInstance(false, {}, [
            ValidationResult.newInstance(errorKeyDuplicate, { value, row: this.processedRow + 1, duplicateRow }),
          ])
        )
      )(validation)
    } else {
      this.rowsByField[field][value] = this.processedRow + 1
    }
  }

  _parseVernacularNames(row) {
    return this.vernacularLanguageCodes.reduce((accVernacularNames, langCode) => {
      const value = row[langCode]
      if (StringUtils.isBlank(value)) {
        return accVernacularNames
      }
      const vernacularNames = value.split(TaxonVernacularName.NAMES_SEPARATOR).reduce((namesAcc, name) => {
        const nameTrimmed = StringUtils.trim(name)
        if (StringUtils.isBlank(nameTrimmed)) {
          return namesAcc
        }
        return [...namesAcc, TaxonVernacularName.newTaxonVernacularName(langCode, nameTrimmed)]
      }, [])

      if (vernacularNames.length === 0) {
        return accVernacularNames
      }
      return { ...accVernacularNames, [langCode]: vernacularNames }
    }, {})
  }

  _parseExtraProps(row: Record<string, any>): Record<string, unknown> {
    const extraProps: Record<string, unknown> = {}
    for (const { key, originalHeader } of Object.values(this.extraPropsDefs)) {
      const value = row[originalHeader]
      if (!StringUtils.isBlank(value)) {
        extraProps[key] = value
      }
    }
    return extraProps
  }
}
