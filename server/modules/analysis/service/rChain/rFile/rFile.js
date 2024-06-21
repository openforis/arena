import * as StringUtils from '@core/stringUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

import { arenaInfo, sourceWithTryCatch, source } from '../rFunctions'

const _contentSeparator = `${StringUtils.NEW_LINE}${StringUtils.NEW_LINE}`

const pathsWithErrorThrown = ['system/init', 'system/close']
const pathsWithErrorsIgnored = ['system/login', 'system/statistical-analysis']

export const padStart = StringUtils.padStart(3, '0')

export default class RFile {
  constructor(rChain, dir, fileName) {
    this._rChain = rChain
    this._dir = dir
    this._fileName = `${fileName}.R`
    this._path = FileUtils.join(this._dir, this._fileName)
    this._pathRelative = this._path.slice(this._rChain.dir.length + 1)
  }

  get rChain() {
    return this._rChain
  }

  get dir() {
    return this._dir
  }

  get fileName() {
    return this._fileName
  }

  get path() {
    return this._path
  }

  get pathRelative() {
    return this._pathRelative
  }

  async appendContent(...contentLines) {
    await FileUtils.appendFile(this.path, contentLines.join(StringUtils.NEW_LINE))
    await FileUtils.appendFile(this.path, _contentSeparator)
    return this
  }

  async logInfo(content) {
    return this.appendContent(arenaInfo(this._fileName, content))
  }

  async init(commentedOut = false) {
    await FileUtils.appendFile(this.path)

    const shouldThrowErrors = pathsWithErrorThrown.some((path) => this.path.includes(path))
    const ignoreErrors = pathsWithErrorsIgnored.some((path) => this.path.includes(path))

    let fileArenaContent = shouldThrowErrors
      ? source(this.pathRelative)
      : sourceWithTryCatch(this.pathRelative, ignoreErrors)

    if (commentedOut) {
      fileArenaContent = `# ${fileArenaContent}`
    }

    await FileUtils.appendFile(this._rChain.fileArena, fileArenaContent + _contentSeparator)

    return this
  }
}
