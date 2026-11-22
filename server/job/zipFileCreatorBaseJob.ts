import type { ArenaJobContext } from '@openforis/arena-core'
import { ZipArchive } from 'archiver'

import * as ProcessUtils from '@core/processUtils'

import * as FileUtils from '@server/utils/file/fileUtils'
import Job from '@server/job/job'

export interface ZipFileCreatorJobContext extends ArenaJobContext {
  archive?: ZipArchive
  outputFileName?: string
  filePath?: string
}

export default class ZipFileCreatorBaseJob<C extends ZipFileCreatorJobContext = any> extends Job<C> {
  async onStart(): Promise<void> {
    await super.onStart()
    const { outputFileName: outputFileNameParam = null, surveyId } = this.context

    // generate output file name if not specified in params
    const outputFileName = outputFileNameParam || `export_${surveyId}_${Date.now()}.zip`

    const outputFilePath = FileUtils.join(ProcessUtils.ENV.tempFolder, outputFileName)

    this.logDebug(`using output file: ${outputFilePath}`)

    const outputFileStream = FileUtils.createWriteStream(outputFilePath)

    const archive = new ZipArchive()
    archive.pipe(outputFileStream)

    this.setContext({ archive, outputFileName, filePath: outputFilePath } as Partial<C>)
  }

  async beforeSuccess(): Promise<void> {
    await super.beforeSuccess()
    const { archive } = this.context
    await archive?.finalize()
  }

  async generateResult(): Promise<any> {
    const result = await super.generateResult()
    const { outputFileName } = this.context
    return {
      ...result,
      outputFileName,
    }
  }
}
