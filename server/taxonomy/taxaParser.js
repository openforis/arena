const parse = require('csv-parse')
const R = require('ramda')

const {languageCodes} = require('../../common/app/languages')
const {isNotBlank} = require('../../common/stringUtils')
const {newTaxon} = require('../../common/survey/taxonomy')
const {validateTaxon} = require('../../server/taxonomy/taxonomyValidator')

const requiredColumns = [
  'code',
  'family',
  'genus',
  'scientific_name',
]

class TaxaParser {

  constructor (taxonomyId, inputBuffer, callback) {
    this.taxonomyId = taxonomyId
    this.inputBuffer = inputBuffer
    this.callback = callback
  }

  async start () {
    this.result = {
      taxa: [],
      errors: {},
    }

    const parser = await parse(this.inputBuffer, {
      columns: (columns) => {
        this.validateHeader(columns)
        this.vernacularLanguages = R.intersection(columns, languageCodes)
        return columns
      },
      delimiter: ',',
      skip_empty_lines: true,
    })
      .on('readable', async () => {
        if (this.isHeaderValid()) {
          let record
          let row = 1 //row 0 is header
          while (record = parser.read()) {
            const taxonParseResult = await this.parseTaxon(record)
            if (taxonParseResult.taxon) {
              this.result.taxa.push(taxonParseResult.taxon)
            } else {
              this.result.errors[row] = taxonParseResult.errors
            }
            row++
          }
        } else {
          this.onEnd()
        }
      })
      .on('end', () => this.onEnd())
  }

  onEnd () {
    this.callback(this.result)
  }

  validateHeader (columns) {
    const missingColumns = R.difference(requiredColumns, columns)
    if (!R.isEmpty(missingColumns)) {
      this.result.errors[0] = `Missing required columns: ${R.join(', ', missingColumns)}`
    }
  }

  isHeaderValid () {
    return !R.has(0, this.result.errors)
  }

  async parseTaxon (record) {
    const {family, genus, scientific_name, code, ...vernacularNames} = record

    const taxon = R.assoc('props', {
      code,
      family,
      genus,
      scientificName: scientific_name,
      vernacularNames: this.parseVernacularNames(vernacularNames)
    })(newTaxon(this.taxonomyId))

    const validation = await validateTaxon(this.result.taxa, taxon)

    return validation.valid
      ? {
        taxon
      }
      : {
        errors: validation.fields
      }
  }

  parseVernacularNames (vernacularNames) {
    return R.reduce((acc, langCode) => {
      const vernacularName = vernacularNames[langCode]
      return isNotBlank(vernacularName) ? R.assoc(langCode, vernacularName, acc) : acc
    }, {}, this.vernacularLanguages)
  }
}

module.exports = {
  TaxaParser,
}
