import * as FileUtils from '@server/utils/file/fileUtils'
import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'

const FILE_INIT_API = FileUtils.join(__dirname, 'init-api.R')

export default class RFileInitApi extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'init-api')
  }

  async init() {
    await super.init()

    await FileUtils.copyFile(FILE_INIT_API, this.path)
  }
}
