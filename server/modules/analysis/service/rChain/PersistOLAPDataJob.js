import { FileFormats } from '@core/fileFormats'

import Job from '@server/job/job'
import FileZip from '@server/utils/file/fileZip'
import * as FlatDataReader from '@server/utils/file/flatDataReader'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export default class PersistOLAPDataJob extends Job {
  constructor(params) {
    super(params, PersistOLAPDataJob.type)

    this.survey = null
    this.fileZip = null
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
    await this.clearOLAPDataTables()

    await this.writeOLAPData()
  }

  async clearOLAPDataTables() {
    // TODO
  }

  async writeOLAPData() {
    const zipEntryNames = this.fileZip.getEntryNames()
    this.total = zipEntryNames.length
    for await (const zipEntryName of zipEntryNames) {
      await this.importZipEntry(zipEntryName)
      this.incrementProcessedItems()
    }
  }

  async importZipEntry(zipEntryName) {
    const stream = await this.zipFile.getEntryStream(zipEntryName)
    this.reader = FlatDataReader.createReaderFromStream({
      stream,
      fileFormat: FileFormats.csv,
      onRow: async (row) => {
        // TODO store data in RDB OLAP data table
      },
    })
    await this.reader.start()
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

PersistOLAPDataJob.type = 'PersistResultsJob'
