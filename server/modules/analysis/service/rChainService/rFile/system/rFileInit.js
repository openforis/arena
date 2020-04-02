import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as ProcessUtils from '@core/processUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

import RFileSystem from './rFileSystem'
import { dbSendQuery, setConnection, setVar } from '../../rFunctions'

const FILE_INIT = FileUtils.join(__dirname, 'init.R')

export default class RFileInit extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'init')
  }

  async init() {
    await super.init()
    const { surveyId } = this.rChain

    await FileUtils.copyFile(FILE_INIT, this.path)

    await this.appendContent(
      setConnection(
        ProcessUtils.ENV.pgHost,
        ProcessUtils.ENV.pgDatabase,
        ProcessUtils.ENV.pgUser,
        ProcessUtils.ENV.pgPassword,
        ProcessUtils.ENV.pgPort
      )
    )

    const schema = SchemaRdb.getName(surveyId)
    const setSearchPath = dbSendQuery(`set search_path to '${schema}', 'public'`)
    await this.appendContent(setSearchPath)

    await this.appendContent(setVar('arena.host', `'${this.rChain.serverUrl}/'`))

    return this
  }
}
