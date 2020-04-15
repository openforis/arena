import * as ProcessingChain from '@common/analysis/processingChain'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import RFileSystem from './rFileSystem'

import { arenaEndTime, arenaStartTime, dbDisconnect, dbSendQuery, setVar, sysTime, asNumeric } from '../../rFunctions'

export default class RFileClose extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'close')
  }

  async init() {
    await super.init()

    const chainTable = `${getSurveyDBSchema(this.rChain.surveyId)}.processing_chain`
    const updateChain = dbSendQuery(
      `update ${chainTable} set status_exec = '${ProcessingChain.statusExec.success}' where uuid = '${this.rChain.chainUuid}'`
    )
    await this.appendContent(updateChain)

    await this.appendContent(dbDisconnect())

    await this.appendContent(setVar(arenaEndTime, sysTime()))

    const execTime = asNumeric(`(${arenaEndTime} - ${arenaStartTime})`, `units='secs'`)
    const logEnd = `paste('Processing chain successfully executed in' , ${execTime} , 'seconds' , sep = ' ')`
    return this.logInfo(logEnd)
  }
}
