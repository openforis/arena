import { FileNames } from '@openforis/arena-core'

const nameWithIndexRegEx = /(.*)\s\((\d+)\)/ // file name like "example (1).txt"

export class UniqueFileNamesGenerator {
  constructor() {
    this._fileNameByKey = {}
    this._keyByFileName = {}
  }

  generateUniqueFileName(inputFileName, key) {
    if (this._fileNameByKey[key]) {
      throw new Error('Cannot generate a unique file name associated to the same key')
    }
    if (!this._keyByFileName[inputFileName]) {
      this._keyByFileName[inputFileName] = key
      this._fileNameByKey[key] = inputFileName
      return inputFileName
    }
    let generatedFileName = this._generateNextFileName(inputFileName)
    while (this._keyByFileName[generatedFileName]) {
      generatedFileName = this._generateNextFileName(generatedFileName)
    }
    this._keyByFileName[generatedFileName] = key
    this._fileNameByKey[key] = generatedFileName
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

  get fileNameByKey() {
    return this._fileNameByKey
  }

  get keyByFileName() {
    return this._keyByFileName
  }
}
