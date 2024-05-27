import FileZip from '@server/utils/file/fileZip'
import * as FileUtils from '@server/utils/file/fileUtils'

const directories = {
  files: 'files',
}

const pathSeparator = '/'

export class DataImportFileReader {
  constructor({ filePath, includeFiles }) {
    this.filePath = filePath
    this.includeFiles = includeFiles
    this.fileZip = null
  }

  async init() {
    if (this.includeFiles) {
      this.fileZip = new FileZip(this.filePath)
      await this.fileZip.init()
    }
  }

  async getCsvFileStream({ nodeDefName }) {
    if (this.includeFiles) {
      const entryName = `${nodeDefName}.csv`
      return this.fileZip.getEntryStream(entryName)
    }
    return FileUtils.createReadStream(this.filePath)
  }

  async getFile({ fileName: fileNameParam, fileUuid }) {
    const possibleFileNames = [fileNameParam]
    if (fileUuid) {
      const extension = FileUtils.getFileExtension(fileNameParam)
      possibleFileNames.push(`${fileUuid}.bin`, `${fileUuid}.${extension}`)
    }
    for await (const fileName of possibleFileNames) {
      const entryName = [directories.files, fileName].join(pathSeparator)
      if (this.fileZip.hasEntry(entryName)) {
        return this.fileZip.getEntryData(entryName)
      }
    }
    return null
  }

  close() {
    this.fileZip?.close()
  }
}
