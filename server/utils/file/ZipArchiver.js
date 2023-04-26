import Archiver from 'archiver'

import * as FileUtils from './fileUtils'

export class ZipArchiver {
  constructor(tempFileName = null) {
    this._outputFilePath = tempFileName ? FileUtils.tempFilePath(tempFileName) : FileUtils.newTempFilePath()
    const outputFileStream = FileUtils.createWriteStream(this._outputFilePath)
    this._archiver = new Archiver('zip')
    this._archiver.pipe(outputFileStream)
  }

  file({ path, entryName }) {
    this._archiver.file(path, { entryName })
  }

  directory({ path }) {
    this._archiver.directory(path, false)
  }

  pipe(outputStrem) {
    this._archiver.pipe(outputStrem)
  }

  async finalize() {
    await this._archiver.finalize()
  }

  get outputFilePath() {
    return this._outputFilePath
  }
}
