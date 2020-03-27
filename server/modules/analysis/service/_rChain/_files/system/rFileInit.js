import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as ProcessUtils from '@core/processUtils'

import * as FileUtils from '@server/utils/file/fileUtils'
import { dbSendQuery, setConnection, setVar } from '@server/modules/analysis/service/_rChain/rFunctions'
import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'

const FILE_INIT = FileUtils.join(__dirname, 'init.R')

export default class RFileInit extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'init')
  }

  async init() {
    await super.init()
    const surveyId = this.rChain.surveyId

    await FileUtils.copyFile(FILE_INIT, this.path)

    await this.appendContent(
      setConnection(
        ProcessUtils.ENV.pgHost,
        ProcessUtils.ENV.pgDatabase,
        ProcessUtils.ENV.pgUser,
        ProcessUtils.ENV.pgPassword,
        ProcessUtils.ENV.pgPort,
      ),
    )

    const schema = SchemaRdb.getName(surveyId)
    const setSearchPath = dbSendQuery(`set search_path to '${schema}', 'public'`)
    await this.appendContent(setSearchPath)

    return await this.appendContent(setVar('arena.host', `'${this.rChain.serverUrl}/'`))
  }
}
