import * as Chain from '@common/analysis/chain'

import * as ApiRoutes from '../../../../../../../common/apiRoutes'
import RFileSystem from './rFileSystem'

import { arenaEndTime, arenaStartTime, arenaPut, asNumeric, paste, setVar, sysTime, unlinkWd } from '../../rFunctions'

export default class RFileClose extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'close')
  }

  async init() {
    await super.init()

    const { surveyId, chainUuid, token } = this.rChain

    const params = { statusExec: `'${Chain.statusExec.success}'`, token: `'${token}'` }
    const updateChain = arenaPut(ApiRoutes.rChain.chainStatusExec({ surveyId, chainUuid }), params)
    await this.appendContent(updateChain)

    await this.appendContent(setVar(arenaEndTime, sysTime()))

    const execTime = asNumeric(`(${arenaEndTime} - ${arenaStartTime})`, 'secs')
    const logEnd = paste([`'Processing chain successfully executed in'`, execTime, `'seconds'`])
    const logEndError = paste([`'Processing chain executed with errors in'`, execTime, `'seconds'`])

    await this.appendContent(`if(global_arena_error == TRUE){`)
    await this.logInfo(logEndError)
    await this.appendContent(`}else{`)
    await this.logInfo(logEnd)
    await this.appendContent(`}`)

    return this.appendContent(unlinkWd)
  }
}
