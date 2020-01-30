import * as FileUtils from '@server/utils/file/fileUtils'

class RFile {
  constructor(rChain, file) {
    this._file = file
  }

  async init() {
    FileUtils.appendFile(this._file)
  }
}

export default RFile
