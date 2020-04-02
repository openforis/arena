import * as PromiseUtils from '@core/promiseUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

import RFileSystem from './rFileSystem'
import { setVar, source } from '../../rFunctions'

const dirNameInit = 'init'
const fileNamesInit = ['init-session', 'init-packages', 'init-log', 'init-api', 'init-chain']

function* writeInitFiles(rFileInit) {
  for (let i = 0; i < fileNamesInit.length; i += 1) {
    const fileNameInit = fileNamesInit[i]

    const fileName = `${fileNameInit}.R`
    const fileInitSrc = FileUtils.join(__dirname, fileName)
    const fileInitDest = FileUtils.join(rFileInit.dirInit, fileName)

    const pathRelativeSplit = rFileInit.pathRelative.split(FileUtils.sep)
    const dirRelativeSplit = pathRelativeSplit.slice(0, pathRelativeSplit.length - 1)
    const fileInitSourcePath = FileUtils.join(...dirRelativeSplit, dirNameInit, fileName)

    yield Promise.all([
      FileUtils.copyFile(fileInitSrc, fileInitDest),
      rFileInit.appendContent(source(fileInitSourcePath)),
    ])
  }
}

export default class RFileInit extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'init')
    this.dirInit = FileUtils.join(this.dir, dirNameInit)
  }

  async init() {
    await super.init()

    await FileUtils.mkdir(this.dirInit)

    this.appendContent(setVar('arena.host', `'${this.rChain.serverUrl}/'`))

    await PromiseUtils.asyncGenerator(writeInitFiles(this))

    return this
  }
}
