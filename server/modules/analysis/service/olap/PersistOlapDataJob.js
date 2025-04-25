import { FileNames } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { FileFormats } from '@core/fileFormats'
import * as StringUtils from '@core/stringUtils'
import * as Chain from '@common/analysis/chain'
import TableOlapData from '@common/model/db/tables/olapData/table'

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
    const chains = await ChainManager.fetchChains({ surveyId }, tx)
    this.chain = chains.find(Chain.hasSamplingDesign)

    this.fileZip = new FileZip(filePath)
    await this.fileZip.init()
  }

  async execute() {
    await this.writeData()
  }

  async writeData() {
    const zipEntryNames = this.fileZip.getEntryNames()
    this.total = zipEntryNames.length

    for await (const zipEntryName of zipEntryNames) {
      await this.importZipEntry({ zipEntryName })
      this.incrementProcessedItems()
    }
  }

  async importZipEntry({ zipEntryName }) {
    const { context, survey, chain, tx } = this
    const { cycle } = context
    const entityDefName = FileNames.getName(StringUtils.removePrefix(zipEntryNamePrefix)(zipEntryName))
    const entityDef = Survey.getNodeDefByName(entityDefName)(survey)
    const baseUnitDef = Survey.getBaseUnitNodeDef({ chain })(survey)

    await SurveyRdbManager.clearOlapData({ survey, cycle, entityDef, baseUnitDef }, tx)

    const olapDataRowsBatchPersister = new BatchPersister(
      async (values) => SurveyRdbManager.insertOlapData({ survey, cycle, chain, entityDef, values }, this.tx),
      insertBatchSize
    )
    const stream = await this.fileZip.getEntryStream(zipEntryName)
    this.reader = FlatDataReader.createReaderFromStream({
      stream,
      fileFormat: FileFormats.csv,
      onRow: async (row) => {
        if (this.isCanceled()) {
          this.reader.cancel()
          return
        }
        this.validateRow({ row, entityDef })
        await olapDataRowsBatchPersister.addItem(row)
      },
    })
    await this.reader.start()
    await olapDataRowsBatchPersister.flush()
    this.reader = null
  }

  validateRow({ row, entityDef }) {
    const { context, survey, chain } = this
    const { cycle } = context
    const baseUnitDef = Survey.getBaseUnitNodeDef({ chain })(survey)
    const table = new TableOlapData({ survey, cycle, entityDef, baseUnitDef })
    const rowFields = Object.keys(row)
    const requiredColumnNames = table.requiredColumnNamesForInsert
    const missingRequiredColumnNames = requiredColumnNames.filter((colName) => !rowFields.includes(colName))
    if (missingRequiredColumnNames.length > 0) {
      throw new Error('missing required columns: ' + missingRequiredColumnNames)
    }
    const expectedColumnNames = table.columnNamesForInsert
    const unexpectedColumnNames = rowFields.filter((colName) => !expectedColumnNames.includes(colName))
    if (unexpectedColumnNames.length > 0) {
      throw new Error('unexpected columns: ' + unexpectedColumnNames)
    }
    return true
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
