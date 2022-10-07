import * as PromiseUtils from '@core/promiseUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

import RFileSystem from './rFileSystem'
import { setVar, source } from '../../rFunctions'

const dirNameInit = 'init'
const fileNamesInit = [
  'init-utils',
  'init-session',
  'init-packages',
  'init-log',
  'init-api',
  'init-chain',
  'init-handle-errors',
]

export default class RFileInit extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'init')
    this.dirInit = FileUtils.join(this.dir, dirNameInit)
  }

  async init() {
    await super.init()

    await FileUtils.mkdir(this.dirInit)

    await PromiseUtils.each(fileNamesInit, async (fileNameInit) => {
      const fileName = `${fileNameInit}.R`
      const fileInitSrc = FileUtils.join(__dirname, fileName)
      const fileInitDest = FileUtils.join(this.dirInit, fileName)

      const pathRelativeSplit = this.pathRelative.split(FileUtils.sep)
      const dirRelativeSplit = pathRelativeSplit.slice(0, pathRelativeSplit.length - 1)
      const fileInitSourcePath = FileUtils.join(...dirRelativeSplit, dirNameInit, fileName)

      await Promise.all([FileUtils.copyFile(fileInitSrc, fileInitDest), this.appendContent(source(fileInitSourcePath))])
    })

    let arenaServerUrl = this.rChain.serverUrl
    if (arenaServerUrl.startsWith('http://') && !arenaServerUrl.startsWith('http://localhost')) {
      arenaServerUrl = arenaServerUrl.replace('http://', 'https://')
    }
    return this.appendContent(setVar('arena.host', `'${arenaServerUrl}/'`))
  }
}
