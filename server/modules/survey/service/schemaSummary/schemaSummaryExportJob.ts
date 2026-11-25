import { FileFormats } from '@core/fileFormats'
import Job, { type JobParams } from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'

import { generateSchemaSummaryItems } from './schemaSummary'

export default class SchemaSummaryExportJob extends Job {
  static readonly type: string = 'SchemaSummaryExportJob'

  constructor(params?: Partial<JobParams>) {
    super(SchemaSummaryExportJob.type, params)
  }

  async execute() {
    const { surveyId, cycle, fileFormat = FileFormats.xlsx, aiDescriptions = null } = this.context

    const items = await generateSchemaSummaryItems({
      surveyId,
      cycle,
      aiDescriptions,
      fileFormat,
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

  beforeSuccess() {
    // counted in the browser, which generated the descriptions
    const { tempFileName, aiDescriptionsFailedCount = 0, aiDescriptionsNotDoneCount = 0 } = this.context
    this.setResult({ tempFileName, aiDescriptionsFailedCount, aiDescriptionsNotDoneCount })
    return Promise.resolve()
  }
}
