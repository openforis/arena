import Job from '@server/job/job'

import * as TempFileManager from '../manager/tempFileManager'

/**
 * Merges uploaded temp chunks into a single file before the main import work starts.
 */
export default class PrepareImportFileJob extends Job {
  constructor(params?: any) {
    super('PrepareImportFileJob', params)
  }

  shouldExecute() {
    const { fileId, filePath, totalChunks } = this.context
    return Promise.resolve(!filePath && Boolean(fileId && totalChunks))
  }

  async execute() {
    const { fileId, totalChunks } = this.context

    this.total = totalChunks

    const filePath = await TempFileManager.mergeTempChunks({
      fileId,
      totalChunks,
      onChunkMerged: () => {
        this.incrementProcessedItems()
      },
    })

    this.setContext({ filePath })
  }
}
