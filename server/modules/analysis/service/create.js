import { DB } from '@openforis/arena-server'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

export const create = async ({ user, surveyId, chain }) => {
  const res = await DB.tx((t) =>
    t.batch([
      ChainRepository.insertChain({ surveyId, chain }, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.chainCreate, chain, false, t),
    ])
  )

  return res[0]
}
