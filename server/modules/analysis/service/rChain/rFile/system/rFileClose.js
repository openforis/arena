import * as ApiRoutes from '../../../../../../../common/apiRoutes'
import * as ProcessingChain from '../../../../../../../common/analysis/processingChain'

import RFileSystem from './rFileSystem'

import {
  arenaEndTime,
  arenaStartTime,
  arenaPut,
  asNumeric,
  paste,
  q,
  setVar,
  sysTime,
  unlinkWd,
} from '../../rFunctions'

export default class RFileClose extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'close')
  }

  async init() {
    await super.init()

    const { surveyId, chainUuid } = this.rChain

    const params = { statusExec: `'${ProcessingChain.statusExec.success}'` }
    const updateChain = arenaPut(ApiRoutes.rChain.chainStatusExec(surveyId, chainUuid), params)
    await this.appendContent(updateChain)

    await this.appendContent(setVar(arenaEndTime, sysTime()))

    const execTime = asNumeric(`(${arenaEndTime} - ${arenaStartTime})`, 'secs')
    const logEnd = paste([`'Processing chain successfully executed in'`, execTime, `'seconds'`])
    await this.logInfo(logEnd)

    return this.appendContent(unlinkWd, q())
  }
}
