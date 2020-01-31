import * as FileUtils from '@server/utils/file/fileUtils'

class RFile {
  constructor(rChain, file) {
    this._rChain = rChain
    this._file = file
  }

  async init() {
    await FileUtils.appendFile(this._file)
  }
}

export default RFile
