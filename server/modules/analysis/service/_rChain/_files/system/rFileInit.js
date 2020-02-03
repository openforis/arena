import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as ProcessUtils from '@core/processUtils'
import * as UserAnalysis from '@core/user/userAnalysis'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as UserAnalysisManager from '@server/modules/user/manager/userAnalysisManager'
import { dbConnect, dbSendQuery } from '@server/modules/analysis/service/_rChain/rFunctions'
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

    const userAnalysis = await UserAnalysisManager.fetchUserAnalysisBySurveyId(surveyId)

    const connection = dbConnect(
      ProcessUtils.ENV.pgHost,
      ProcessUtils.ENV.pgDatabase,
      UserAnalysis.getName(userAnalysis),
      UserAnalysis.getPassword(userAnalysis),
      ProcessUtils.ENV.pgPort,
    )
    await this.appendContent(connection)

    const schema = SchemaRdb.getName(surveyId)
    const setSearchPath = dbSendQuery(`set search_path to '${schema}', 'public'`)
    return await this.appendContent(setSearchPath)
  }
}
