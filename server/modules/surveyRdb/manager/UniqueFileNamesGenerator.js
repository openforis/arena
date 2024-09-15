import { FileNames } from '@openforis/arena-core'

const nameWithIndexRegEx = /(.*)\s\((\d+)\)/ // file name like "example (1).txt"

export class UniqueFileNamesGenerator {
  constructor() {
    this._fileNamesByKey = {}
    this._keysByFileName = {}
  }

  generateUniqueFileName(inputFileName, key) {
    if (this._fileNamesByKey[key]) {
      throw new Error('Cannot generate a unique file name associated to the same key')
    }
    if (!this._keysByFileName[inputFileName]) {
      this._keysByFileName[inputFileName] = key
      this._fileNamesByKey[key] = inputFileName
      return inputFileName
    }
    let generatedFileName = this._generateNextFileName(inputFileName)
    while (this._keysByFileName[generatedFileName]) {
      generatedFileName = this._generateNextFileName(generatedFileName)
    }
    this._keysByFileName[generatedFileName] = key
    this._fileNamesByKey[key] = generatedFileName
    return generatedFileName
  }

  _generateNextFileName(inputFileName) {
    const name = FileNames.getName(inputFileName)
    const extension = FileNames.getExtension(inputFileName)
    const matchRes = name.match(nameWithIndexRegEx)
    let nameUpdated
    if (matchRes) {
      const [, nameWithoutIndex, index] = matchRes
      const nextIndex = Number(index) + 1
      nameUpdated = `${nameWithoutIndex} (${nextIndex})`
    } else {
      nameUpdated = `${name} (1)`
    }
    return extension ? `${nameUpdated}.${extension}` : nameUpdated
  }

  get fileNamesByKey() {
    return this._fileNamesByKey
  }

  get keysByFileName() {
    return this._keysByFileName
  }
}
