import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as ProcessUtils from '@core/processUtils'

import * as FileUtils from '@server/utils/file/fileUtils'
import { dbConnect, dbSendQuery } from '@server/modules/analysis/service/_rChain/rFunctions'

const FILE_INIT = FileUtils.join(__dirname, 'init.R')

export default class RFileInit extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'init')
  }

  async init() {
    await super.init()
    await FileUtils.copyFile(FILE_INIT, this.path)

    const connection = dbConnect(
      ProcessUtils.ENV.pgHost,
      ProcessUtils.ENV.pgDatabase,
      ProcessUtils.ENV.pgUser,
      ProcessUtils.ENV.pgPassword,
      ProcessUtils.ENV.pgPort,
    )
    await this.appendContent(connection)

    const schema = SchemaRdb.getName(this.rChain.surveyId)
    const setSearchPath = dbSendQuery(`set search_path to '${schema}', 'public'`)
    return await this.appendContent(setSearchPath)
  }
}
