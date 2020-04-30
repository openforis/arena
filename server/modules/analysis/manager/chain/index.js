import * as ProcessingChain from '../../../../../common/analysis/processingChain'
import * as ActivityLog from '../../../../../common/activityLog/activityLog'

import { db } from '../../../../db/db'

import * as ChainRepository from '../../repository/chain'
import * as ActivityLogRepository from '../../../activityLog/repository/activityLogRepository'

export { fetchChains, fetchChain, updateChain } from '../../repository/chain'

export const updateChainStatusExec = async ({ user, surveyId, chainUuid, statusExec }) =>
  db.tx(async (tx) => {
    const promises = [ChainRepository.updateChainStatusExec({ surveyId, chainUuid, statusExec }, tx)]
    if (statusExec === ProcessingChain.statusExec.success) {
      const type = ActivityLog.type.processingChainStatusExecSuccess
      const content = { [ActivityLog.keysContent.uuid]: chainUuid }
      promises.push(ActivityLogRepository.insert(user, surveyId, type, content, false, tx))
    }

    return Promise.all(promises)
  })
