import * as PromiseUtils from '@core/promiseUtils'
import { quote } from '@core/stringUtils'
import * as Survey from '@core/survey/survey'

import * as FileUtils from '@server/utils/file/fileUtils'

import RFileSystem from './rFileSystem'
import { setVar, source } from '../../rFunctions'

const dirNameInit = 'init'
const fileNamesInit = [
  'init-session',
  'init-packages',
  'init-utils',
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

    const { survey, serverUrl, token } = this.rChain
    const language = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

    return this.appendContent(
      setVar('arena.token', quote(token)),
      setVar('arena.host', quote(serverUrl)),
      setVar('arena.preferredLanguage', quote(language))
    )
  }
}
