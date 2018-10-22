const fastcsv = require('fast-csv')
const R = require('ramda')
const {EventEmitter} = require('events')

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
    this.csvString = inputBuffer.toString('utf8')

    this.eventEmitter = new EventEmitter()

    this.canceled = false
    this.startTime = null
    this.csvStreamEnded = false
    this.totalItems = 0
    this.processedItems = 0
    this.result = null
  }

  start () {
    this.startTime = new Date()
    console.log(`parsing csv file. size ${this.inputBuffer.length}`)

    this.result = {
      taxa: [],
      errors: {},
      vernacularLanguageCodes: [],
    }

    this.processHeaders(validHeaders => {
      console.log(`headers processed. valid: ${validHeaders}`)

      if (!validHeaders) {
        this.dispatchEndEvent()
        return
      }
      this.calculateSize(totalItems => {
        console.log(`total rows: ${totalItems}`)

        this.totalItems = totalItems
        this.processedItems = 0

        this.dispatchStartEvent()

        const csvStream = fastcsv.fromString(this.csvString, {headers: true})
          .on('data', async data => {
            csvStream.pause()

            if (this.canceled) {
              csvStream.destroy()
            } else {
              await this.processRow(data)
              csvStream.resume()
            }
          })
          .on('end', () => {
            this.csvStreamEnded = true
            //do not throw immediately "end" event, last item still being processed
          })
      })
    })
    return this
  }

  cancel () {
    this.canceled = true
  }

  calculateSize (callback) {
    let count = 0
    fastcsv.fromString(this.csvString, {headers: true})
      .on('data', () => count++)
      .on('end', () => callback(count))
  }

  processHeaders (callback) {
    const csvStream = fastcsv.fromString(this.csvString, {headers: false})
    csvStream.on('data', async columns => {
      csvStream.destroy() //stop streaming CSV
      const validHeaders = this.validateHeaders(columns)
      if (validHeaders) {
        this.result.vernacularLanguageCodes = R.innerJoin((a, b) => a === b, languageCodes, columns)
      }
      callback(validHeaders)
    })
  }

  async processRow (data) {
    const taxonParseResult = await this.parseTaxon(data)

    if (taxonParseResult.taxon) {
      this.result.taxa.push(taxonParseResult.taxon)
    } else {
      this.result.errors[this.processedItems + 1] = taxonParseResult.errors
    }
    this.processedItems++

    this.dispatchProgressEvent()

    if (this.csvStreamEnded) {
      this.dispatchEndEvent()
    }
  }

  validateHeaders (columns) {
    const missingColumns = R.difference(requiredColumns, columns)
    if (R.isEmpty(missingColumns)) {
      return true
    } else {
      this.result.errors[0] = `Missing required columns: ${R.join(', ', missingColumns)}`
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
    })(newTaxon(this.taxonomyId))

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

  onStart (listener) {
    return this.addEventListener('start', listener)
  }

  onProgress (listener) {
    return this.addEventListener('progress', listener)
  }

  onEnd (listener) {
    return this.addEventListener('end', listener)
  }

  addEventListener (eventType, listener) {
    this.eventEmitter.addListener(eventType, listener)
    return this
  }

  dispatchStartEvent () {
    this.eventEmitter.emit('start', this.createProgressEvent())
  }

  dispatchProgressEvent () {
    this.eventEmitter.emit('progress', this.createProgressEvent())
  }

  dispatchEndEvent () {
    const end = new Date()
    const elapsedSeconds = (end.getTime() - this.startTime.getTime()) / 1000
    console.log(`csv parsed in ${elapsedSeconds} seconds. parsed taxa: ${this.result.taxa.length} errors: ${R.keys(this.result.errors).length}`)

    this.eventEmitter.emit('end', R.assoc('result', this.result)(this.createProgressEvent()))
  }

  createProgressEvent () {
    return {
      total: this.totalItems,
      processed: this.processedItems,
    }
  }
}

module.exports = {
  TaxaParser,
}
