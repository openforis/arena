const fastcsv = require('fast-csv')
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

  constructor (taxonomyId, inputBuffer) {
    this.taxonomyId = taxonomyId
    this.inputBuffer = inputBuffer

    this.result = null
  }

  start (callback) {
    const start = new Date()
    console.log(`parsing csv file. size ${this.inputBuffer.length}`)

    this.result = {
      taxa: [],
      errors: {},
      vernacularLanguageCodes: [],
    }

    const csvString = this.inputBuffer.toString('utf8')

    let row = 0,
      headersRead = false,
      validHeaders = false

    fastcsv.fromString(csvString, {headers: true})
      .on('data', async data => {
        if (!headersRead) {
          headersRead = true
          validHeaders = this.validateHeaders(data)
          if (validHeaders) {
            this.result.vernacularLanguageCodes = R.innerJoin((a, b) => a === b, languageCodes, R.keys(data))
          }
          console.log(`headers valid`)
        } else if (validHeaders) {
          const taxonParseResult = await this.parseTaxon(data)
          if (taxonParseResult.taxon) {
            this.result.taxa.push(taxonParseResult.taxon)
          } else {
            this.result.errors[row] = taxonParseResult.errors
          }
          row++
          if (row % 1000 === 0)
            console.log(`${row} rows parsed `)
        }
      })
      .on('end', () => {
        const end = new Date()
        const elapsedSeconds = (end.getTime() - start.getTime()) / 1000
        console.log(`csv parsed successfully in ${elapsedSeconds}. taxa: ${this.result.taxa.length} errors: ${R.keys(this.result.errors).length}`)
        callback(this.result)
      })
  }

  validateHeaders (data) {
    const columns = R.keys(data)
    const missingColumns = R.difference(requiredColumns, columns)
    if (!R.isEmpty(missingColumns)) {
      this.result.errors[0] = `Missing required columns: ${R.join(', ', missingColumns)}`
      return false
    } else {
      return true
    }
  }

  async parseTaxon (data) {
    const {family, genus, scientific_name, code, ...vernacularNames} = data

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
    }, {}, this.result.vernacularLanguageCodes)
  }
}

module.exports = {
  TaxaParser,
}
