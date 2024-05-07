import Archiver from 'archiver'

import * as ProcessUtils from '@core/processUtils'

import * as FileUtils from '@server/utils/file/fileUtils'
import Job from '@server/job/job'

export default class ZipFileCreatorBaseJob extends Job {
  async onStart() {
    super.onStart()
    const { outputFileName: outputFileNameParam = null, surveyId } = this.context

    // generate output file name if not specified in params
    const outputFileName = outputFileNameParam || `export_${surveyId}_${Date.now()}.zip`

    const outputFilePath = FileUtils.join(ProcessUtils.ENV.tempFolder, outputFileName)

    this.logDebug(`using output file: ${outputFilePath}`)

    const outputFileStream = FileUtils.createWriteStream(outputFilePath)

    const archive = Archiver('zip')
    archive.pipe(outputFileStream)

    this.setContext({ archive, outputFileName, filePath: outputFilePath })
  }

  async onEnd() {
    await super.onEnd()
    const { archive } = this.context
    await archive?.finalize()
  }

  generateResult() {
    const result = super.generateResult()
    const { outputFileName } = this.context
    return {
      ...result,
      outputFileName,
    }
  }
}
