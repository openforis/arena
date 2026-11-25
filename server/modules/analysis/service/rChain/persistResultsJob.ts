import type { Readable } from 'node:stream'

import { FileFormats } from '@core/fileFormats'
import * as Record from '@core/record/record'
import type { JobParams } from '@server/job/job'
import { DataImportFlatDataFileReader } from '@server/modules/dataImport/service/dataImportJob/dataImportFlatDataFileReader'
import FlatDataImportJob from '@server/modules/dataImport/service/dataImportJob/flatDataImportJob'
import { RecordProvidersDefault } from '@server/modules/record/manager/recordEvaluationContextDefault'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import type FileZip from '@server/utils/file/fileZip'

import { RecordsProvider } from './recordsProvider'

export default class PersistResultsJob extends FlatDataImportJob {
  static readonly type: string = 'PersistResultsJob'
  fileZip: FileZip
  recordsProvider: RecordsProvider
  stream: Readable

  constructor(params?: Partial<JobParams>) {
    super(params, PersistResultsJob.type)
  }

  async onStart() {
    const { surveyId, tx } = this

    this.setContext({ includeFiles: true }) // use it to make onStart initialize the dataImportFileReader

    await super.onStart()

    this.recordsProvider = new RecordsProvider({ surveyId, tx })

    this.stream = await this.dataImportFileReader.getCsvFileStream()
  }

  shouldCalculatedTotalItems() {
    return false
  }

  fetchSurvey() {
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

  createFlatDataReader() {
    const { context, stream } = this
    const { cycle, nodeDefUuid, survey } = context

    const reader = DataImportFlatDataFileReader.createReaderFromStream({
      stream,
      fileFormat: FileFormats.csv,
      survey,
      categoryItemProvider: RecordProvidersDefault.categoryItemProvider,
      cycle,
      nodeDefUuid,
      onRowItem: (item) => this.onRowItem(item),
      onTotalChange: (total) => (this.total = total),
      includeAnalysis: true,
      validateHeaders: false,
    })
    return Promise.resolve(reader)
  }

  async onRowItem(item) {
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
      ...this.getRecordEvaluationContext(),
      entity,
      valuesByDefUuid,
      sideEffect: true,
    })(record)

    this.currentRecord = recordUpdated
    this.recordsProvider.add(recordUpdated)

    await this.persistUpdatedNodes({ nodesUpdated })

    // current record could have been changed(e.g.node flags removed etc): update records cache too
    this.currentRecord = recordUpdated
    this.recordsProvider.add(recordUpdated)

    this.incrementProcessedItems()

    if (this.processed % 1000 === 0) {
      this.logDebug(`${this.processed} items processed`)
    }
  }

  async onEnd() {
    await super.onEnd()
    this.fileZip?.close()
  }
}
