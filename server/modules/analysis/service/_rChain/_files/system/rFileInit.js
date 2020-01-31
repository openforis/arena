import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as ProcessUtils from '@core/processUtils'

import * as FileUtils from '@server/utils/file/fileUtils'

const FILE_INIT = FileUtils.join(__dirname, 'init.R')

export default class RFileInit extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'init')
  }

  async init() {
    await super.init()
    await FileUtils.copyFile(FILE_INIT, this.path)

    const connection = `connection <- dbConnect(driver, host="${ProcessUtils.ENV.pgHost}", dbname="${ProcessUtils.ENV.pgDatabase}", user="${ProcessUtils.ENV.pgUser}", password="${ProcessUtils.ENV.pgPassword}", port=${ProcessUtils.ENV.pgPort});`
    await this.appendContent(connection)

    const schema = SchemaRdb.getName(this.rChain.surveyId)
    const setSearchPath = `dbSendQuery(conn=connection, statement='set search_path to "${schema}", "public"');`
    return await this.appendContent(setSearchPath)
  }
}
