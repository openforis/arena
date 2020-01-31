import * as StringUtils from '@core/stringUtils'

import * as FileUtils from '@server/utils/file/fileUtils'

class RFile {
  constructor(rChain, dir, fileName) {
    this._rChain = rChain
    this._dir = dir
    const fileIndex = StringUtils.padStart(3, '0')(this._rChain.scriptIndexNext)
    this._path = FileUtils.join(this._dir, `${fileIndex}-${fileName}.R`)
  }

  get path() {
    return this._path
  }

  async init() {
    await FileUtils.appendFile(this.path)
  }
}

export class RFileSystem extends RFile {
  constructor(rChain, fileName) {
    super(rChain, rChain.dirSystem, fileName)
  }
}

export class RFileUser extends RFile {
  constructor(rChain, fileName) {
    super(rChain, rChain.dirUser, fileName)
  }
}
