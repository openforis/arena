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
    const { surveyId, cycle, fileFormat = FileFormats.xlsx, aiDescriptions = null } = this.context

    const items = await generateSchemaSummaryItems({
      surveyId,
      cycle,
      aiDescriptions,
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
    // counted in the browser, which generated the descriptions
    const { tempFileName, aiDescriptionsFailedCount = 0 } = this.context
    this.setResult({ tempFileName, aiDescriptionsFailedCount })
  }
}

SchemaSummaryExportJob.type = 'SchemaSummaryExportJob'
