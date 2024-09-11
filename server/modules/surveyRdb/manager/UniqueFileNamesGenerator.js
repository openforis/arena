import { FileNames } from '@openforis/arena-core'

export class UniqueFileNamesGenerator {
  constructor() {
    this.fileNamesByKey = {}
    this.keyByFileName = {}
  }

  generateUniqueFileName(inputFileName, key) {
    if (!this.keyByFileName[inputFileName]) {
      this.keyByFileName[inputFileName] = key
      this.fileNamesByKey[key] = inputFileName
      return inputFileName
    }
    let generatedFileName = this._generateNextFileName(inputFileName)
    while (this.keyByFileName[generatedFileName]) {
      generatedFileName = this._generateNextFileName(generatedFileName)
    }
  }

  _generateNextFileName(inputFileName) {
    const name = FileNames.getName(inputFileName)
    const extension = FileNames.getExtension(inputFileName)
    const nameUpdated = name
    return extension ? `${nameUpdated}.${extension}` : nameUpdated
  }

  get fileNamesByKey() {
    return this.fileNamesByKey
  }
}
