const R = require('ramda')

const db = require('../db/db')

const Job = require('../job/job')

const {languageCodes} = require('../../common/app/languages')
const {isNotBlank} = require('../../common/stringUtils')
const {isValid} = require('../../common/validation/validator')
const Taxonomy = require('../../common/survey/taxonomy')

const {validateTaxon} = require('../taxonomy/taxonomyValidator')
const TaxonomyManager = require('./taxonomyManager')
const CSVParser = require('./csvParser')

const requiredColumns = [
  'code',
  'family',
  'genus',
  'scientific_name',
]

const taxaInsertBufferSize = 500

class TaxonomyImportJob extends Job {

  constructor (params) {
    const {taxonomyId, csvString} = params

    super(TaxonomyImportJob.type, params)

    this.taxonomyId = taxonomyId
    this.csvString = csvString

    this.codesToRow = {} //maps codes to csv file rows
    this.scientificNamesToRow = {} //maps scientific names to csv file rows
    this.taxaInsertBuffer = []
  }

  async execute () {
    const {surveyId, taxonomyId} = this

    this.vernacularLanguageCodes = []

    const validHeaders = await this.processHeaders()

    if (!validHeaders) {
      this.setStatusFailed()
      return
    }
    this.processed = 0

    const csvParser = new CSVParser(this.csvString)

    await db.tx(async t => {
      const taxonomy = await TaxonomyManager.fetchTaxonomyById(surveyId, taxonomyId, true, false, t)

      if (taxonomy.published) {
        throw new Error('cannot overwrite published taxa')
      }

      //delete old draft taxa
      await TaxonomyManager.deleteDraftTaxaByTaxonomyId(surveyId, taxonomyId, t)

      let row = await csvParser.next()

      while (row) {
        if (this.isCanceled()) {
          csvParser.destroy()
          break
        } else {
          await this.processRow(row, t)
        }
        row = await csvParser.next()
      }

      if (this.isCanceled()) {
        throw new Error('canceled; rollback transaction')
      } else {
        const hasErrors = !R.isEmpty(R.keys(this.errors))
        if (hasErrors) {
          this.setStatusFailed()
          throw new Error('errors found; rollback transaction')
        } else {
          await this.flushTaxaInsertBuffer(t)

          //set vernacular lang codes in taxonomy
          //set log to false temporarily; set user to null as it's only needed for logging
          await TaxonomyManager.updateTaxonomyProp(this.user, surveyId, taxonomy.uuid,
            'vernacularLanguageCodes', this.vernacularLanguageCodes, t)

          this.setStatusSucceeded()
        }
      }
    }).catch(e => {
      if (this.isRunning()) {
        this.addError({all: {valid: false, errors: [e.toString()]}})
        this.setStatusFailed()
      }
    })
    csvParser.destroy()
  }

  async calculateTotal () {
    const csvParser = new CSVParser(this.csvString)
    return await csvParser.calculateSize()
  }

  async processHeaders () {
    const csvParser = new CSVParser(this.csvString, false)
    let headers = await csvParser.next()
    csvParser.destroy()
    const validHeaders = this.validateHeaders(headers)
    if (validHeaders) {
      this.vernacularLanguageCodes = R.innerJoin((a, b) => a === b, languageCodes, headers)
    }
    return validHeaders
  }

  async processRow (data, t) {
    const taxon = await this.parseTaxon(data)

    if (isValid(taxon)) {
      await this.addTaxonToInsertBuffer(taxon, t)
    } else {
      this.addError(taxon.validation.fields)
    }
    this.incrementProcessedItems()
  }

  validateHeaders (columns) {
    const missingColumns = R.difference(requiredColumns, columns)
    if (R.isEmpty(missingColumns)) {
      return true
    } else {
      this.addError({
        all: {
          valid: false,
          errors: [`Missing required columns: ${R.join(', ', missingColumns)}`]
        }
      })
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

    return await this.validateTaxon(taxon)
  }

  async validateTaxon (taxon) {
    const validation = await validateTaxon([], taxon) //do not validate code and scientific name uniqueness

    //validate taxon uniqueness among inserted values
    if (validation.valid) {
      const code = Taxonomy.getTaxonCode(taxon)
      const duplicateCodeRow = this.codesToRow[code]

      if (duplicateCodeRow) {
        validation.fields['code'] = {valid: false, errors: ['duplicate']}
      } else {
        this.codesToRow[code] = this.processed + 1
      }

      const scientificName = Taxonomy.getTaxonScientificName(taxon)
      const duplicateScientificNameRow = this.scientificNamesToRow[scientificName]

      if (duplicateScientificNameRow) {
        validation.fields['scientificName'] = {valid: false, errors: ['duplicate']}
      } else {
        this.scientificNamesToRow[scientificName] = this.processed + 1
      }

      validation.valid = !(duplicateCodeRow || duplicateScientificNameRow)
    }

    return {
      ...taxon,
      validation
    }
  }

  parseVernacularNames (vernacularNames) {
    return R.reduce((acc, langCode) => {
      const vernacularName = vernacularNames[langCode]
      return isNotBlank(vernacularName) ? R.assoc(langCode, vernacularName, acc) : acc
    }, {}, this.vernacularLanguageCodes)
  }

  addError (error) {
    this.errors['' + (this.processed + 1)] = error
  }

  async addTaxonToInsertBuffer (taxon, t) {
    this.taxaInsertBuffer.push(R.omit(['validation'], taxon))

    if (this.taxaInsertBuffer.length === taxaInsertBufferSize) {
      await this.flushTaxaInsertBuffer(t)
    }
  }

  async flushTaxaInsertBuffer (t) {
    if (this.taxaInsertBuffer.length > 0) {
      await TaxonomyManager.insertTaxa(this.user, this.surveyId, this.taxaInsertBuffer, t)
      this.taxaInsertBuffer.length = 0
    }
  }
}

TaxonomyImportJob.type = 'TaxonomyImportJob'

module.exports = TaxonomyImportJob
