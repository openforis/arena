import Job from '@server/job/job'

import * as TempFileManager from '../manager/tempFileManager'

/**
 * Merges uploaded temp chunks into a single file before the main import work starts.
 */
export default class PrepareImportFileJob extends Job {
  constructor(params) {
    super('PrepareImportFileJob', params)
  }

  async shouldExecute() {
    const { fileId, filePath, totalChunks } = this.context
    return !filePath && Boolean(fileId && totalChunks)
  }

  async execute() {
    const { fileId, totalChunks, totalFileSize } = this.context

    this.total = totalChunks

    const filePath = await TempFileManager.mergeTempChunks({
      fileId,
      totalChunks,
      totalFileSize,
      onChunkMerged: async () => {
        this.incrementProcessedItems()
      },
    })

    this.setContext({ filePath })
  }
}
