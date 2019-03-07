const R = require('ramda')

const Job = require('../job/job')

const {languageCodes} = require('../../common/app/languages')
const {isNotBlank} = require('../../common/stringUtils')
const Validator = require('../../common/validation/validator')
const Taxonomy = require('../../common/survey/taxonomy')

const TaxonomyValidator = require('../taxonomy/taxonomyValidator')
const TaxonomyManager = require('./taxonomyManager')
const TaxonomyImportHelper = require('./taxonomyImportHelper')
const CSVParser = require('../../common/file/csvParser')

const {taxonPropKeys} = Taxonomy

const requiredColumns = [
  'code',
  'family',
  'genus',
  'scientific_name',
]

class TaxonomyImportJob extends Job {

  constructor (params) {
    super(TaxonomyImportJob.type, params)

    const {taxonomyUuid, filePath} = params

    this.taxonomyUuid = taxonomyUuid
    this.filePath = filePath

    this.codesToRow = {} //maps codes to csv file rows
    this.scientificNamesToRow = {} //maps scientific names to csv file rows

    this.taxonomyImportHelper = null //to be initialized before starting the import
  }

  async execute (tx) {
    const {surveyId, taxonomyUuid, filePath} = this

    this.total = await new CSVParser(filePath).calculateSize()

    const validHeaders = await this.processHeaders()

    if (!validHeaders) {
      this.setStatusFailed()
      return
    }

    const taxonomy = await TaxonomyManager.fetchTaxonomyByUuid(surveyId, taxonomyUuid, true, false, tx)

    if (taxonomy.published) {
      throw new Error('cannot overwrite published taxa')
    }

    this.taxonomyImportHelper = new TaxonomyImportHelper(this.user, this.surveyId, this.vernacularLanguageCodes)

    //delete old draft taxa
    await TaxonomyManager.deleteDraftTaxaByTaxonomyUuid(surveyId, taxonomyUuid, tx)

    const csvParser = new CSVParser(filePath)

    this.processed = 0

    let row = await csvParser.next()

    while (row) {
      if (this.isCanceled()) {
        break
      } else {
        await this.processRow(row, tx)
      }
      row = await csvParser.next()
    }

    if (this.isRunning()) {
      if (R.isEmpty(this.errors)) {
        await this.taxonomyImportHelper.finalizeImport(taxonomy, tx)
      } else {
        this.setStatusFailed()
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
      await this.taxonomyImportHelper.addTaxonToInsertBuffer(taxon, t)
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

    const taxon = Taxonomy.newTaxon(this.taxonomyUuid, code, family, genus, scientific_name, this.parseVernacularNames(vernacularNames))

    return await this.validateTaxon(taxon)
  }

  async validateTaxon (taxon) {
    const validation = await TaxonomyValidator.validateTaxon([], taxon) //do not validate code and scientific name uniqueness

    //validate taxon uniqueness among inserted values
    if (validation.valid) {
      const code = R.pipe(Taxonomy.getTaxonCode, R.toUpper)(taxon)
      const duplicateCodeRow = this.codesToRow[code]

      if (duplicateCodeRow) {
        validation.fields[taxonPropKeys.code] = {valid: false, errors: [Validator.errorKeys.duplicate]}
      } else {
        this.codesToRow[code] = this.processed + 1
      }

      const scientificName = Taxonomy.getTaxonScientificName(taxon)
      const duplicateScientificNameRow = this.scientificNamesToRow[scientificName]

      if (duplicateScientificNameRow) {
        validation.fields[taxonPropKeys.scientificName] = {valid: false, errors: [Validator.errorKeys.duplicate]}
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
