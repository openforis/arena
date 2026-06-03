import { FileFormats } from '@core/fileFormats'

import Job from '@server/job/job'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as FileUtils from '@server/utils/file/fileUtils'

import { generateSchemaSummaryItems } from './schemaSummary'

export default class SchemaSummaryExportJob extends Job {
  constructor(params) {
    super(SchemaSummaryExportJob.type, params)
  }

  async execute() {
    const { user, surveyId, cycle, fileFormat = FileFormats.xlsx, includeAiDescriptions = false } = this.context

    const items = await generateSchemaSummaryItems({
      surveyId,
      cycle,
      user,
      includeAiDescriptions,
      onProgress: ({ total, processed }) => {
        this.total = total
        this.processed = processed
      },
      stopIfFunction: () => this.isCanceled(),
    })

    const tempFileName = FileUtils.newTempFileName()
    const outputFilePath = FileUtils.tempFilePath(tempFileName)
    const outputStream = FileUtils.createWriteStream(outputFilePath)

    await FlatDataWriter.writeItemsToStream({ outputStream, items, options: { removeNewLines: false }, fileFormat })

    this.setContext({ tempFileName })
  }

  async beforeSuccess() {
    const { tempFileName } = this.context
    this.setResult({ tempFileName })
  }
}

SchemaSummaryExportJob.type = 'SchemaSummaryExportJob'
