const fastcsv = require('fast-csv')
const R = require('ramda')

const Job = require('../job/job')

const {languageCodes} = require('../../common/app/languages')
const {isNotBlank} = require('../../common/stringUtils')
const Taxonomy = require('../../common/survey/taxonomy')

const {validateTaxon} = require('../taxonomy/taxonomyValidator')
const TaxonomyManager = require('./taxonomyManager')

const requiredColumns = [
  'code',
  'family',
  'genus',
  'scientific_name',
]

class CSVRowProvider {

  constructor (csvString) {
    this.currentRowData = null
    this.canceled = false
    this.csvStreamEnded = false

    this.csvStream = fastcsv.fromString(csvString, {headers: true})
      .on('data', data => this.onData(data))
      .on('end', () => this.onStreamEnd())
    this.csvStream.pause()
  }

  onData (data) {
    this.csvStream.pause()

    if (this.canceled) {
      this.csvStream.destroy()
      this.csvStreamEnded = true
      this.currentRowData = null
    } else {
      this.currentRowData = data
    }
  }

  onStreamEnd () {
    this.csvStreamEnded = true
  }

  async next () {
    return new Promise(resolve => {
      if (this.csvStreamEnded) {
        resolve(null)
      } else {
        this.currentRowData = null

        setTimeout(() => {
          if (this.currentRowData) {
            resolve(this.currentRowData)
          }
        }, 30)

        this.csvStream.resume()
      }
    })
  }

  cancel () {
    this.canceled = true
  }

}

class TaxonomyImportJob extends Job {

  constructor (params) {
    const {taxonomyId, csvString} = params

    super(TaxonomyImportJob.type, params)

    this.taxonomyId = taxonomyId
    this.csvString = csvString
  }

  async execute () {
    const {surveyId, taxonomyId} = this

    this.result = {
      taxa: [],
      vernacularLanguageCodes: [],
    }

    const validHeaders = await this.processHeaders()

    if (!validHeaders) {
      this.setStatusFailed()
      return
    }
    this.processed = 0

    const csvRowProvider = new CSVRowProvider(this.csvString)

    let row = await csvRowProvider.next()

    while (row && !this.isCanceled()) {
      if (this.isCanceled()) {
        csvRowProvider.cancel()
      } else {
        await this.processRow(row)
      }
      row = await csvRowProvider.next()
    }

    const hasErrors = !R.isEmpty(R.keys(this.errors))
    if (hasErrors) {
      this.setStatusFailed()
    } else {
      await TaxonomyManager.persistTaxa(surveyId, taxonomyId, this.result.taxa, this.result.vernacularLanguageCodes)
      this.setStatusSucceeded()
    }
  }

  calculateTotal () {
    const csvString = this.csvString
    return new Promise(resolve => {
      let count = 0
      fastcsv.fromString(csvString, {headers: true})
        .on('data', () => count++)
        .on('end', () => resolve(count))
    })
  }

  processHeaders () {
    const $this = this
    return new Promise(function (resolve) {
      const csvStream = fastcsv.fromString($this.csvString, {headers: false})
      csvStream.on('data', async columns => {
        csvStream.destroy() //stop streaming CSV
        const validHeaders = $this.validateHeaders(columns)
        if (validHeaders) {
          $this.result.vernacularLanguageCodes = R.innerJoin((a, b) => a === b, languageCodes, columns)
        }
        resolve(validHeaders)
      })
    })
  }

  async processRow (data) {
    const {result} = this

    const taxonParseResult = await this.parseTaxon(data)

    if (taxonParseResult.taxon) {
      result.taxa.push(taxonParseResult.taxon)
    } else {
      this.errors['' + (this.processed + 1)] = taxonParseResult.errors
    }
    this.incrementProcessedItems()
  }

  validateHeaders (columns) {
    const missingColumns = R.difference(requiredColumns, columns)
    if (R.isEmpty(missingColumns)) {
      return true
    } else {
      this.errors[0] = `Missing required columns: ${R.join(', ', missingColumns)}`
      return false
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
    })(Taxonomy.newTaxon(this.taxonomyId))

    const validation = await validateTaxon(this.result.taxa, taxon)

    return validation.valid
      ? {taxon}
      : {errors: validation.fields}
  }

  parseVernacularNames (vernacularNames) {
    return R.reduce((acc, langCode) => {
      const vernacularName = vernacularNames[langCode]
      return isNotBlank(vernacularName) ? R.assoc(langCode, vernacularName, acc) : acc
    }, {}, this.result.vernacularLanguageCodes)
  }

}

TaxonomyImportJob.type = 'TaxonomyImportJob'

module.exports = TaxonomyImportJob
