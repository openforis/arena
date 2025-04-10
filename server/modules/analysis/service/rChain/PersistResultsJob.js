import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import CsvDataImportJob from '@server/modules/dataImport/service/DataImportJob/CsvDataImportJob'
import { DataImportCsvFileReader } from '@server/modules/dataImport/service/DataImportJob/dataImportCsvFileReader'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import FileZip from '@server/utils/file/fileZip'
import * as RChainResultService from '@server/modules/analysis/service/rChainResultService'

import { RecordsProvider } from './RecordsProvider'

export default class PersistResultsJob extends CsvDataImportJob {
  constructor(params) {
    super(params, PersistResultsJob.type)
  }

  async onStart() {
    const { surveyId, tx } = this
    const { nodeDefUuid, filePath, chainUuid, cycle } = this.context
    await super.onStart()

    // survey is fetched after onStart is called
    const { survey } = this.context

    this.recordsProvider = new RecordsProvider({ surveyId, tx })

    this.fileZip = new FileZip(filePath)
    await this.fileZip.init()

    const entityDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const zipEntryName = `${NodeDef.getName(entityDef)}.csv`
    this.stream = await this.fileZip.getEntryStream(zipEntryName)

    // Store the entity definition for later use
    this.entityDef = entityDef
    this.chainUuid = chainUuid
    this.cycle = cycle

    // Initialize array to store CSV data for OLAP
    this.csvData = []
  }

  async fetchSurvey() {
    const { surveyId, tx } = this
    const { cycle } = this.context

    return SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      {
        surveyId,
        cycle,
        advanced: true,
        draft: true,
        includeAnalysis: true,
      },
      tx
    )
  }

  async createCsvReader() {
    const { cycle, nodeDefUuid, survey } = this.context

    return DataImportCsvFileReader.createReaderFromStream({
      stream: this.stream,
      survey,
      cycle,
      nodeDefUuid,
      onRowItem: async (item) => this.onRowItem(item),
      onTotalChange: (total) => (this.total = total),
      includeAnalysis: true,
      validateHeaders: false,
    })
  }

  async onRowItem(item) {
    const { survey } = this.context
    const { errors, row, valuesByDefUuid } = item

    if (errors.length > 0) {
      errors.forEach((error) => {
        this._addError(error.key || error.toString(), error.params)
      })
      await this.setStatusFailed()
      return
    }

    // Store row data for CSV export
    this.csvData.push(row)

    const { record_uuid: recordUuid, parent_uuid: entityUuid } = row
    const record = await this.recordsProvider.getOrFetch(recordUuid)
    const entity = Record.getNodeByUuid(entityUuid)(record)
    const { nodes: nodesUpdated, record: recordUpdated } = await Record.updateAttributesInEntityWithValues({
      survey,
      entity,
      valuesByDefUuid,
      sideEffect: true,
    })(record)

    this.currentRecord = recordUpdated
    this.recordsProvider.add(recordUpdated)

    await this.persistUpdatedNodes({ nodesUpdated })

    // // current record could have been changed (e.g. node flags removed etc): update records cache too
    this.currentRecord = recordUpdated
    this.recordsProvider.add(recordUpdated)

    this.incrementProcessedItems()

    if (this.processed % 1000 === 0) {
      this.logDebug(`${this.processed} items processed`)
    }
  }

  async onEnd() {
    await super.onEnd()

    // Save CSV data for OLAP if we have data and didn't fail
    if (this.csvData.length > 0 && !this.isFailed()) {
      try {
        const { surveyId, tx } = this

        await RChainResultService.saveResultToCsv({
          surveyId,
          chainUuid: this.chainUuid,
          cycle: this.cycle,
          entityDef: this.entityDef,
          data: this.csvData,
          tx,
        })

        this.logDebug(`Saved ${this.csvData.length} rows to CSV for OLAP analysis`)
      } catch (error) {
        this.logError('Error saving CSV data for OLAP', error)
      }
    }

    this.fileZip?.close()
  }
}

PersistResultsJob.type = 'PersistResultsJob'
