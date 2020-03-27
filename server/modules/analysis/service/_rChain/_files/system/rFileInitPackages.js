import * as FileUtils from '@server/utils/file/fileUtils'
import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'

const FILE_INIT_PACKAGES = FileUtils.join(__dirname, 'init-packages.R')

export default class RFileInitPackages extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'init-packages')
  }

  async init() {
    await super.init()

    await FileUtils.copyFile(FILE_INIT_PACKAGES, this.path)
  }
}
