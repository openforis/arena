const R = require('ramda')

const Log = require('../../../log/log')
const Job = require('../../../job/job')

const { languageCodes } = require('../../../../common/app/languages')
const { isNotBlank } = require('../../../../common/stringUtils')
const CSVParser = require('../../../../common/file/csvParser')

const Validator = require('../../../../common/validation/validator')
const Taxon = require('../../../../common/survey/taxon')

const TaxonomyValidator = require('../taxonomyValidator')
const TaxonomyManager = require('../persistence/taxonomyManager')
const TaxonomyImportManager = require('../persistence/taxonomyImportManager')

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
    const { taxonomyUuid, filePath } = this
    const surveyId = this.getSurveyId()

    Log.debug(`starting taxonomy import on survey ${surveyId}, importing into taxonomy ${taxonomyUuid}`)

    this.total = await new CSVParser(filePath).calculateSize()

    Log.debug(`${this.total} rows found in the CSV file`)

    const validHeaders = await this.processHeaders()

    if (!validHeaders) {
      Log.debug('invalid header, setting status to "failed"')
      await this.setStatusFailed()
      return
    }

    const taxonomy = await TaxonomyManager.fetchTaxonomyByUuid(surveyId, taxonomyUuid, true, false, tx)

    if (taxonomy.published) {
      throw new Error('cannot overwrite published taxa')
    }

    this.taxonomyImportManager = new TaxonomyImportManager(this.getUser(), surveyId, this.vernacularLanguageCodes)

    //delete old draft taxa
    await TaxonomyManager.deleteDraftTaxaByTaxonomyUuid(surveyId, taxonomyUuid, tx)

    Log.debug('start CSV file parsing')

    const csvParser = new CSVParser(filePath)

    this.processed = 0

    let row = await csvParser.next()

    while (row) {
      if (this.isCanceled()) {
        break
      }

      await this.processRow(row, tx)

      row = await csvParser.next()
    }

    Log.debug(`CSV file processed, ${this.processed} rows processed`)

    if (this.isRunning()) {
      if (R.isEmpty(this.errors)) {
        Log.debug('no errors found, finalizing import')
        await this.taxonomyImportManager.finalizeImport(taxonomy, tx)
      } else {
        Log.debug(`${this.errors.length} errors found`)
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

  async processRow (data, t) {
    const taxon = await this.parseTaxon(data)

    if (Validator.isValid(taxon)) {
      await this.taxonomyImportManager.addTaxonToInsertBuffer(taxon, t)
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
    const { family, genus, scientific_name, code, ...vernacularNames } = data

    const taxon = Taxon.newTaxon(this.taxonomyUuid, code, family, genus, scientific_name, this.parseVernacularNames(vernacularNames))

    return await this.validateTaxon(taxon)
  }

  async validateTaxon (taxon) {
    const validation = await TaxonomyValidator.validateTaxon([], taxon) //do not validate code and scientific name uniqueness

    //validate taxon uniqueness among inserted values
    if (validation.valid) {
      const code = R.pipe(Taxon.getCode, R.toUpper)(taxon)
      const duplicateCodeRow = this.codesToRow[code]

      if (duplicateCodeRow) {
        validation.fields[Taxon.propKeys.code] = { valid: false, errors: [Validator.errorKeys.duplicate] }
      } else {
        this.codesToRow[code] = this.processed + 1
      }

      const scientificName = Taxon.getScientificName(taxon)
      const duplicateScientificNameRow = this.scientificNamesToRow[scientificName]

      if (duplicateScientificNameRow) {
        validation.fields[Taxon.propKeys.scientificName] = { valid: false, errors: [Validator.errorKeys.duplicate] }
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
}

TaxonomyImportJob.type = 'TaxonomyImportJob'

module.exports = TaxonomyImportJob
