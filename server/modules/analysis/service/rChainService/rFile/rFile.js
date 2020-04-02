import * as StringUtils from '@core/stringUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

import { arenaInfo } from '../rFunctions'

const _lineSeparator = `${StringUtils.NEW_LINE}${StringUtils.NEW_LINE}`

export const padStart = StringUtils.padStart(3, '0')

export default class RFile {
  constructor(rChain, dir, fileName) {
    this._rChain = rChain
    this._dir = dir
    const fileIndex = padStart(this._rChain.scriptIndexNext)
    this._fileName = `${fileIndex}-${fileName}.R`
    this._path = FileUtils.join(this._dir, this._fileName)
    this._pathRelative = this._path.slice(this._rChain.dir.length + 1)
  }

  get rChain() {
    return this._rChain
  }

  get dir() {
    return this._dir
  }

  get path() {
    return this._path
  }

  get pathRelative() {
    return this._pathRelative
  }

  async appendContent(...contentLines) {
    await FileUtils.appendFile(this.path, contentLines.join(_lineSeparator) + _lineSeparator)
    return this
  }

  async logInfo(content) {
    return this.appendContent(arenaInfo(this._fileName, content))
  }

  async init() {
    await FileUtils.appendFile(this.path)
    await FileUtils.appendFile(
      this._rChain.fileArena,
      `source("${this.pathRelative}")${StringUtils.NEW_LINE}${StringUtils.NEW_LINE}`
    )
    return this
  }
}
