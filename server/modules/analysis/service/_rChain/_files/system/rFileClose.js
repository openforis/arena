import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'

import * as ProcessingChain from '@common/analysis/processingChain'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import {
  arenaEndTime,
  arenaStartTime,
  dbDisconnect,
  dbSendQuery,
  setVar,
  sysTime,
} from '@server/modules/analysis/service/_rChain/rFunctions'

export default class RFileClose extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'close')
  }

  async init() {
    await super.init()

    const chainTable = `${getSurveyDBSchema(this.rChain.surveyId)}.processing_chain`
    const updateChain = dbSendQuery(
      `update ${chainTable} set status_exec = '${ProcessingChain.statusExec.success}' where uuid = '${this.rChain.chainUuid}'`,
    )
    await this.appendContent(updateChain)

    await this.appendContent(dbDisconnect())

    await this.appendContent(setVar(arenaEndTime, sysTime()))

    const logEnd = `paste(paste('Processing chain successfully executed in' , as.numeric((${arenaEndTime} - ${arenaStartTime}) , units='secs') , sep = ' ') , 'seconds' , sep = ' ')`
    return this.logInfo(logEnd)
  }
}
