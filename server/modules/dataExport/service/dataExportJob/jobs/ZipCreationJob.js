import Job from '@server/job/job'

import * as FileUtils from '@server/utils/file/fileUtils'
import { ZipUtils } from '@server/utils/file/zipUtils'

export default class ZipCreationJob extends Job {
  constructor(params) {
    super('ZipCreationJob', params)
  }

  async execute() {
    const { exportUuid, outputDir } = this.context

    const outputFileName = `${exportUuid}.zip`
    const tempZipFilePath = FileUtils.tempFilePath(outputFileName)

    await ZipUtils.zipDirIntoFile({
      dirPath: outputDir,
      outputFilePath: tempZipFilePath,
      onTotal: (total) => (this.total = total),
      onProgress: ({ processed }) => (this.processed = processed),
    })

    this.setContext({ outputFileName })
  }
}
