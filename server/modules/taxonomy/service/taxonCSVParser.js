import * as R from 'ramda'

import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Validation from '@core/validation/validation'

import * as StringUtils from '@core/stringUtils'

import * as TaxonomyValidator from '../taxonomyValidator'

const _parseVernacularNames = (vernacularNamesByLang) =>
  Object.entries(vernacularNamesByLang).reduce(
    (accVernacularNames, [langCode, nameOriginal]) =>
      R.ifElse(
        StringUtils.isBlank,
        R.always(accVernacularNames),
        R.pipe(
          R.split(TaxonVernacularName.NAMES_SEPARATOR),
          R.map((name) => TaxonVernacularName.newTaxonVernacularName(langCode, StringUtils.trim(name))),
          R.ifElse(R.isEmpty, R.always(accVernacularNames), (names) => R.assoc(langCode, names)(accVernacularNames))
        )
      )(nameOriginal),
    {}
  )

export default class TaxonCSVParser {
  constructor(taxonomyUuid, vernacularLanguageCodes) {
    this.taxonomyUuid = taxonomyUuid
    this.vernacularLanguageCodes = vernacularLanguageCodes

    this.processedRow = 0
    this.rowsByField = {
      [Taxon.propKeys.code]: {}, // Maps codes to csv file rows
      [Taxon.propKeys.scientificName]: {}, // Maps scientific names to csv file rows
    }
  }

  async parseTaxon(row) {
    const { family: familyRow, genus: genusRow, scientific_name: scientificName, code, ...vernacularNamesByLang } = row

    const family = familyRow || 'no_data'

    // the genus is always the first word of the scientific name
    const genus = scientificName ? scientificName.split(' ')[0] : null

    const taxon = Taxon.newTaxon(
      this.taxonomyUuid,
      code,
      family,
      genus,
      scientificName,
      _parseVernacularNames(vernacularNamesByLang)
    )

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
              params: { row: this.processedRow + 1, duplicateRow },
            },
          ])
        )
      )(validation)
    } else {
      this.rowsByField[field][value] = this.processedRow + 1
    }
  }
}
