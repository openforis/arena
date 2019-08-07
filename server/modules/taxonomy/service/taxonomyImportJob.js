const R = require('ramda')

const Job = require('../../../job/job')

const { languageCodes } = require('../../../../common/app/languages')
const { isNotBlank } = require('../../../../common/stringUtils')
const CSVParser = require('../../../../common/file/csvParser')

const Validator = require('../../../../common/validation/validator')
const Taxonomy = require('../../../../common/survey/taxonomy')
const Taxon = require('../../../../common/survey/taxon')

const TaxonomyValidator = require('../taxonomyValidator')
const TaxonomyManager = require('../manager/taxonomyManager')
const TaxonomyImportManager = require('../manager/taxonomyImportManager')

const SystemError = require('../../../../server/utils/systemError')

const requiredColumns = [
  'code',
  'family',
  'genus',
  'scientific_name',
]

class TaxonomyImportJob extends Job {

  constructor (params) {
    super(TaxonomyImportJob.type, params)

    const { taxonomyUuid, filePath } = params

    this.taxonomyUuid = taxonomyUuid
    this.filePath = filePath

    this.codesToRow = {} //maps codes to csv file rows
    this.scientificNamesToRow = {} //maps scientific names to csv file rows

    this.taxonomyImportManager = null //to be initialized before starting the import
  }

  async execute (tx) {
    const { taxonomyUuid } = this
    const surveyId = this.getSurveyId()

    this.logDebug(`starting taxonomy import on survey ${surveyId}, importing into taxonomy ${taxonomyUuid}`)

    // 1. load taxonomy and check it has not published

    const taxonomy = await TaxonomyManager.fetchTaxonomyByUuid(surveyId, taxonomyUuid, true, false, tx)

    if (Taxonomy.isPublished(taxonomy)) {
      throw new SystemError('cannotOverridePublishedTaxa')
    }

    // 2. calculate total number of rows
    this.total = await new CSVParser(this.filePath).calculateSize()

    this.logDebug(`${this.total} rows found in the CSV file`)

    // 3. process headers
    const validHeaders = await this.processHeaders()

    if (!validHeaders) {
      this.logDebug('invalid header, setting status to "failed"')
      await this.setStatusFailed()
      return
    }

    // 4. delete old draft taxa
    await TaxonomyManager.deleteDraftTaxaByTaxonomyUuid(surveyId, taxonomyUuid, tx)

    // 5. start CSV row parsing
    await this._parseCSVRows(taxonomy)
  }

  async _parseCSVRows (taxonomy) {
    this.logDebug('start CSV file parsing')

    const surveyId = this.getSurveyId()

    this.taxonomyImportManager = new TaxonomyImportManager(this.getUser(), surveyId, this.vernacularLanguageCodes)

    const csvParser = new CSVParser(this.filePath)

    this.processed = 0

    let row = await csvParser.next()

    while (row) {
      if (this.isCanceled()) {
        break
      }

      await this.processRow(row)

      row = await csvParser.next()
    }

    this.logDebug(`CSV file processed, ${this.processed} rows processed`)

    if (this.isRunning()) {
      if (R.isEmpty(this.errors)) {
        this.logDebug('no errors found, finalizing import')
        await this.taxonomyImportManager.finalizeImport(taxonomy, this.tx)
      } else {
        this.logDebug(`${R.keys(this.errors).length} errors found`)
        await this.setStatusFailed()
      }
    }

    csvParser.destroy()
  }

  async processHeaders () {
    const csvParser = new CSVParser(this.filePath, false)
    const headers = await csvParser.next()
    csvParser.destroy()
    const validHeaders = this.validateHeaders(headers)
    if (validHeaders) {
      this.vernacularLanguageCodes = R.innerJoin((a, b) => a === b, languageCodes, headers)
    }
    return validHeaders
  }

  async processRow (data) {
    const taxon = await this.parseTaxon(data)

    if (Validator.isValid(taxon)) {
      await this.taxonomyImportManager.addTaxonToInsertBuffer(taxon, this.tx)
    } else {
      this.addError(R.pipe(Validator.getValidation, Validator.getFieldValidations)(taxon))
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
    const { family, genus, scientific_name, code, ...vernacularNames } = data

    const taxon = Taxon.newTaxon(this.taxonomyUuid, code, family, genus, scientific_name, this.parseVernacularNames(vernacularNames))

    return await this.validateTaxon(taxon)
  }

  async validateTaxon (taxon) {
    let validation = await TaxonomyValidator.validateTaxon([], taxon) //do not validate code and scientific name uniqueness

    //validate taxon uniqueness among inserted values
    if (Validator.isValidationValid(validation)) {
      const code = R.pipe(Taxon.getCode, R.toUpper)(taxon)
      const duplicateCodeRow = this.codesToRow[code]

      if (duplicateCodeRow) {
        validation = Validator.assocFieldValidation(Taxon.propKeys.code, {
          valid: false,
          errors: [{
            key: Validator.errorKeys.duplicateCode,
            params: { row: duplicateCodeRow, duplicateRow: this.processed + 1 }
          }],
        })(validation)
      } else {
        this.codesToRow[code] = this.processed + 1
      }

      const scientificName = Taxon.getScientificName(taxon)
      const duplicateScientificNameRow = this.scientificNamesToRow[scientificName]

      if (duplicateScientificNameRow) {
        validation = Validator.assocFieldValidation(Taxon.propKeys.scientificName, {
          valid: false,
          errors: [{
            key: Validator.errorKeys.duplicateName,
            params: { row: duplicateCodeRow, duplicateRow: this.processed + 1 }
          }],
        })(validation)
      } else {
        this.scientificNamesToRow[scientificName] = this.processed + 1
      }
    }

    return {
      ...taxon,
      validation,
    }
  }

  parseVernacularNames (vernacularNames) {
    return R.reduce((acc, langCode) => {
      const vernacularName = vernacularNames[langCode]
      return isNotBlank(vernacularName) ? R.assoc(langCode, vernacularName, acc) : acc
    }, {}, this.vernacularLanguageCodes)
  }
}

TaxonomyImportJob.type = 'TaxonomyImportJob'

module.exports = TaxonomyImportJob
