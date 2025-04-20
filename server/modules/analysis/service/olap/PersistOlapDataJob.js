import { FileNames } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { FileFormats } from '@core/fileFormats'
import * as StringUtils from '@core/stringUtils'
import * as Chain from '@common/analysis/chain'

import BatchPersister from '@server/db/batchPersister'
import Job from '@server/job/job'
import FileZip from '@server/utils/file/fileZip'
import * as FlatDataReader from '@server/utils/file/flatDataReader'
import * as ChainManager from '@server/modules/analysis/manager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

const insertBatchSize = 1000
const zipEntryNamePrefix = 'OLAP_'

export default class PersistOlapDataJob extends Job {
  constructor(params) {
    super(PersistOlapDataJob.type, params)

    this.survey = null
    this.fileZip = null
    this.olapDataRowsBatchPersister = null
  }

  async onStart() {
    await super.onStart()
    const { surveyId, cycle, tx } = this
    const { filePath } = this.context

    this.survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      {
        surveyId,
        cycle,
        advanced: true,
        draft: true,
        includeAnalysis: true,
      },
      tx
    )

    this.fileZip = new FileZip(filePath)
    await this.fileZip.init()
  }

  async execute() {
    await this.clearTables()

    await this.writeData()
  }

  async clearTables() {
    // TODO
  }

  async writeData() {
    const zipEntryNames = this.fileZip.getEntryNames()
    this.total = zipEntryNames.length
    const { survey, context, tx } = this
    const { cycle } = context
    const surveyId = Survey.getId(survey)
    const chains = await ChainManager.fetchChains({ surveyId }, tx)
    const chain = chains.find(Chain.hasSamplingDesign)

    for await (const zipEntryName of zipEntryNames) {
      const entityDefName = FileNames.getName(StringUtils.removePrefix(zipEntryNamePrefix)(zipEntryName))
      const entityDef = Survey.getNodeDefByName(entityDefName)(survey)
      this.olapDataRowsBatchPersister = new BatchPersister(
        async (values) => SurveyRdbManager.insertOlapData({ survey, cycle, chain, entityDef, values }, this.tx),
        insertBatchSize
      )
      await this.importZipEntry(zipEntryName)
      this.incrementProcessedItems()
    }
  }

  async importZipEntry(zipEntryName) {
    const stream = await this.fileZip.getEntryStream(zipEntryName)
    this.reader = FlatDataReader.createReaderFromStream({
      stream,
      fileFormat: FileFormats.csv,
      onRow: async (row) => {
        // TODO validate row
        await this.olapDataRowsBatchPersister.addItem(row)
      },
    })
    await this.reader.start()
    await this.olapDataRowsBatchPersister.flush()
    this.reader = null
  }

  async cancel() {
    await super.cancel()
    this.reader?.cancel()
  }

  async onEnd() {
    await super.onEnd()
    this.reader?.cancel()
    this.fileZip?.close()
  }
}

PersistOlapDataJob.type = 'PersistOlapDataJob'
