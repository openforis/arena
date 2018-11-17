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

const getDuplicateFieldFromError = error => {
  const violatedConstrainName = 'getErrors' in error ? error.getErrors()[0].constraint : null
  switch (violatedConstrainName) {
    case 'taxon_props_draft_scientific_name_idx':
      return 'scientificName'
    default:
      return 'code'
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

    this.vernacularLanguageCodes = []

    const validHeaders = await this.processHeaders()

    if (!validHeaders) {
      this.setStatusFailed()
      return
    }
    this.processed = 0

    const csvParser = new CSVParser(this.csvString)

    await db.tx(async t => {
      let row = await csvParser.next()

      while (row) {
        if (this.isCanceled()) {
          csvParser.cancel()
          break
        } else {
          await this.processRow(row, t)
        }
        row = await csvParser.next()
      }
      if (!this.isCanceled()) {
        const hasErrors = !R.isEmpty(R.keys(this.errors))
        if (hasErrors) {
          this.setStatusFailed()
        } else {
          await TaxonomyManager.updateTaxonomyProp(surveyId, taxonomyId,
            'vernacularLanguageCodes', this.vernacularLanguageCodes, t)
          this.setStatusSucceeded()
        }
      }
    })
  }

  async calculateTotal () {
    const csvParser = new CSVParser(this.csvString)
    return await csvParser.calculateSize()
  }

  async processHeaders () {
    const csvParser = new CSVParser(this.csvString, false)
    let headers = await csvParser.next()
    csvParser.cancel()
    const validHeaders = this.validateHeaders(headers)
    if (validHeaders) {
      this.vernacularLanguageCodes = R.innerJoin((a, b) => a === b, languageCodes, headers)
    }
    return validHeaders
  }

  async processRow (data, t) {
    const {surveyId} = this

    const taxon = await this.parseTaxon(data)

    if (isValid(taxon)) {
      try {
        await TaxonomyManager.saveTaxon(surveyId, taxon, t)
      } catch (e) {
        const duplicateField = getDuplicateFieldFromError(e)
        this.addError({[duplicateField]: {valid: false, errors: ['duplicate']}})
      }
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
      this.addError(`Missing required columns: ${R.join(', ', missingColumns)}`)
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

    const validation = await validateTaxon([], taxon) //do not validate code and scientific name uniqueness

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
}

TaxonomyImportJob.type = 'TaxonomyImportJob'

module.exports = TaxonomyImportJob
