import * as R from 'ramda'

import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Validation from '@core/validation/validation'

import * as StringUtils from '@core/stringUtils'

import * as TaxonomyValidator from '../taxonomyValidator'

export default class TaxonCSVParser {
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
    const genus = scientificName ? scientificName.split(' ')[0] : null

    const taxon = Taxon.newTaxon({
      taxonomyUuid: this.taxonomyUuid,
      code,
      family,
      genus,
      scientificName,
      vernacularNames: this._parseVernacularNames(otherProps),
      extra: this._parseExtraProps(otherProps),
    })

    const validation = await this._validateTaxon(taxon)

    this.processedRow += 1

    return { ...taxon, validation }
  }

  async _validateTaxon(taxon) {
    const validation = await TaxonomyValidator.validateTaxon([], taxon) // Do not validate code and scientific name uniqueness

    // validate taxon uniqueness among inserted values
    if (Validation.isValid(validation)) {
      const code = R.pipe(Taxon.getCode, R.toUpper)(taxon)
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
      R.pipe(
        Validation.setValid(false),
        Validation.setField(
          field,
          Validation.newInstance(false, {}, [
            {
              key: errorKeyDuplicate,
              params: {
                value,
                row: this.processedRow + 1,
                duplicateRow,
              },
            },
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

  _parseExtraProps(row) {
    return Object.values(this.extraPropsDefs).reduce((accExtraProps, extraProp) => {
      const { key, originalHeader } = extraProp
      const value = row[originalHeader]
      if (StringUtils.isBlank(value)) {
        return accExtraProps
      }
      return { ...accExtraProps, [key]: value }
    }, {})
  }
}
