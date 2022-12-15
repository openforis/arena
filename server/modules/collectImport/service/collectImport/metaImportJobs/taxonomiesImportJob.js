import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Validation from '@core/validation/validation'
import { languageCodesISO639part2 } from '@core/app/languages'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

import Job from '@server/job/job'

import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'
import TaxonomyImportManager from '@server/modules/taxonomy/manager/taxonomyImportManager'

import * as CSVReader from '@server/utils/file/csvReader'

const SPECIES_FILES_PATH = 'species/'
const VERNACULAR_NAMES_SEPARATOR_REGEX = /[,/]/

const fixedColumns = ['id', 'parent_id', 'rank', 'no', 'code', 'scientific_name', 'synonyms']

/**
 * Inserts a taxonomy for each taxonomy in the Collect survey.
 * Saves the list of inserted taxonomies in the "taxonomies" context property.
 */
export default class TaxonomiesImportJob extends Job {
  constructor(params) {
    super('TaxonomiesImportJob', params)

    this.taxonomyCurrent = null // Current taxonomy being imported
    this.taxonomyImportManager = null // Import manager associated to the current taxonomy
    this.rowById = {} // Rows cache: used to get family name
    this.rowNumberByCode = {} // Used to detect duplicate codes
    this.rowNumberByScientificName = {} // Used to detect duplicate scientific names
    this.currentRow = 0 // Current file row number
  }

  async execute() {
    const { tx } = this
    const { collectSurveyFileZip, survey } = this.context

    const taxonomies = []

    const speciesFileNames = collectSurveyFileZip.getEntryNames(SPECIES_FILES_PATH)

    for (const speciesFileName of speciesFileNames) {
      if (this.isCanceled()) {
        break
      }

      await this.importTaxonomyFromSpeciesFile(speciesFileName, tx)

      if (!this.isRunning()) {
        break
      }

      taxonomies.push(this.taxonomyCurrent)
      this.taxonomyCurrent = null
      this.taxonomyImportManager = null

      this.incrementProcessedItems()
    }

    this.setContext({
      taxonomies, // TODO check if it's needed to put taxonomies in context
      survey: Survey.assocTaxonomies(ObjectUtils.toUuidIndexedObj(taxonomies))(survey),
    })
  }

  async importTaxonomyFromSpeciesFile(speciesFileName, tx) {
    const { collectSurveyFileZip, surveyId } = this.context

    this.logDebug(`importing file ${speciesFileName}`)

    // 1. reset duplicate values indexes
    this.rowNumberByCode = {}
    this.rowNumberByScientificName = {}

    // 2. insert taxonomy
    const taxonomyName = speciesFileName.slice(0, speciesFileName.length - 4)

    const taxonomyParam = Taxonomy.newTaxonomy({
      [Taxonomy.keysProps.name]: taxonomyName,
    })
    this.taxonomyCurrent = await TaxonomyManager.insertTaxonomy(
      { user: this.user, surveyId, taxonomy: taxonomyParam, system: true },
      tx
    )
    const taxonomyUuid = Taxonomy.getUuid(this.taxonomyCurrent)

    // 3. parse CSV file
    const speciesFileStream = await collectSurveyFileZip.getEntryStream(`${SPECIES_FILES_PATH}${speciesFileName}`)

    const totalPrevious = this.total

    const csvReader = CSVReader.createReaderFromStream(
      speciesFileStream,
      (headers) => this.onHeaders(headers),
      async (row) => {
        if (this.isCanceled()) {
          csvReader.cancel()
          return
        }
        await this.onRow(speciesFileName, taxonomyUuid, row)
      },
      (total) => {
        this.total = totalPrevious + total
      }
    )
    await csvReader.start()

    if (this.isRunning()) {
      this.logDebug(`file ${speciesFileName} read correctly`)
    }

    if (this.hasErrors()) {
      await this.setStatusFailed()
    } else {
      await this.taxonomyImportManager.finalizeImport()
    }
  }

  async onHeaders(headers) {
    this.vernacularLangCodes = R.innerJoin((a, b) => a === b, languageCodesISO639part2, headers)
    this.extraPropsDefs = headers.reduce((extraPropsAcc, header) => {
      if (!fixedColumns.includes(header) && !languageCodesISO639part2.includes(header)) {
        extraPropsAcc[header] = { key: header }
      }
      return extraPropsAcc
    }, {})

    this.taxonomyImportManager = new TaxonomyImportManager({
      user: this.user,
      surveyId: this.surveyId,
      taxonomy: this.taxonomyCurrent,
      vernacularLanguageCodes: this.vernacularLangCodes,
      extraPropsDefs: this.extraPropsDefs,
      tx: this.tx,
    })
    await this.taxonomyImportManager.init()

    this.currentRow = 1
    this.incrementProcessedItems()
  }

  async onRow(speciesFileName, taxonomyUuid, row) {
    const { id, parent_id: parentId, code, rank, scientific_name: scientificName } = row
    this.rowById[id] = { id, parent_id: parentId, rank, scientific_name: scientificName } // skip vernacular names in rows cache

    if (this.validateRow(speciesFileName, row)) {
      const genus = R.pipe(R.split(' '), R.head)(scientificName)
      const family = this.extractFamily({ row })

      const vernacularNames = R.reduce(
        (accVernacularNames, lang) => {
          const vernacularNames = this.extractVernacularNames({ row, lang })
          const vernacularNamesObjects = vernacularNames.map((name) =>
            TaxonVernacularName.newTaxonVernacularName(lang, name)
          )
          if (vernacularNamesObjects.length === 0) return accVernacularNames
          return { ...accVernacularNames, [lang]: vernacularNamesObjects }
        },
        {},
        this.vernacularLangCodes
      )

      const extra = Object.keys(this.extraPropsDefs).reduce((accExtraProps, extraPropName) => {
        const value = row[extraPropName]
        if (StringUtils.isBlank(value)) {
          return accExtraProps
        }
        return { ...accExtraProps, [extraPropName]: value }
      }, {})

      const taxon = Taxon.newTaxon({ taxonomyUuid, code, family, genus, scientificName, vernacularNames, extra })

      await this.taxonomyImportManager.addTaxonToUpdateBuffer(taxon)
    }

    this.currentRow++
    this.incrementProcessedItems()
  }

  validateRow(speciesFileName, row) {
    // Do not try to insert taxa with empty or duplicate code or duplicate scientific name (DB constraints)
    const { code, scientific_name: scientificName } = row

    if (!code) {
      // ignore rows with blank code (auto-generated by Collect)
      return false
    }

    // Check if code is duplicate
    const rowDuplicateCode = this.rowNumberByCode[code]
    if (rowDuplicateCode) {
      this.addError(
        {
          [Taxon.propKeys.code]: {
            valid: false,
            errors: [
              {
                key: Validation.messageKeys.taxonomyEdit.codeDuplicate,
                params: {
                  value: code,
                  row: this.currentRow,
                  duplicateRow: rowDuplicateCode,
                },
              },
            ],
          },
        },
        speciesFileName
      )
    } else {
      this.rowNumberByCode[code] = this.currentRow
    }

    // Check if scientific name is duplicate
    const rowDuplicateScientificName = this.rowNumberByScientificName[scientificName]
    if (rowDuplicateScientificName) {
      this.addError(
        {
          [Taxon.propKeys.scientificName]: {
            valid: false,
            errors: [
              {
                key: Validation.messageKeys.taxonomyEdit.scientificNameDuplicate,
                params: {
                  value: scientificName,
                  row: this.currentRow,
                  duplicateRow: rowDuplicateScientificName,
                },
              },
            ],
          },
        },
        speciesFileName
      )
    } else {
      this.rowNumberByScientificName[scientificName] = this.currentRow
    }

    return !rowDuplicateCode && !rowDuplicateScientificName
  }

  extractFamily({ row }) {
    if (row.rank === 'family') {
      return row.scientific_name
    }

    // find ancestor row with rank 'family'
    let currentRow = row
    while (currentRow && currentRow.rank !== 'family') {
      currentRow = this.rowById[currentRow.parent_id]
    }
    return currentRow?.scientific_name
  }

  extractVernacularNames({ row, lang }) {
    const vernacularNamesStr = row[lang] || ''
    const vernacularNames = vernacularNamesStr.split(VERNACULAR_NAMES_SEPARATOR_REGEX)
    const vernacularNamesTrimmed = vernacularNames.map((vernacularName) => StringUtils.trim(vernacularName))
    return R.uniq(vernacularNamesTrimmed)
  }
}
