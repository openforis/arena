import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import CsvDataImportJob from '@server/modules/dataImport/service/DataImportJob/CsvDataImportJob'
import { DataImportCsvFileReader } from '@server/modules/dataImport/service/DataImportJob/dataImportCsvFileReader'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import FileZip from '@server/utils/file/fileZip'

import { RecordsProvider } from './RecordsProvider'

export default class PersistResultsJob extends CsvDataImportJob {
  constructor(params) {
    super(params, PersistResultsJob.type)
  }

  async onStart() {
    const { surveyId, tx } = this
    const { nodeDefUuid, filePath } = this.context
    await super.onStart()

    // survey is fetched after onStart is called
    const { survey } = this.context

    this.recordsProvider = new RecordsProvider({ surveyId, tx })

    this.fileZip = new FileZip(filePath)
    await this.fileZip.init()

    const entityDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const zipEntryName = `${NodeDef.getName(entityDef)}.csv`
    this.stream = await this.fileZip.getEntryStream(zipEntryName)
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
  }

  async beforeEnd() {
    await super.beforeEnd()
    throw new Error('TEST')
  }

  async onEnd() {
    await super.onEnd()
    this.fileZip?.close()
  }
}

PersistResultsJob.type = 'PersistResultsJob'
