import { DB } from '@openforis/arena-server'

import * as Chain from '@common/analysis/chain'
import * as ActivityLog from '@common/activityLog/activityLog'
import { TableChain } from '@common/model/db'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import { markSurveyDraft } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

export const update = async ({ user, surveyId, chain }) => {
  const chainUuid = Chain.getUuid(chain)

  return DB.tx(async (t) => {
    const chainDb = await ChainRepository.fetchChain({ surveyId, chainUuid: Chain.getUuid(chain) }, t)
    const propsToUpdate = Chain.getPropsDiff(chain)(chainDb)

    // activity log for each updated prop
    const updates = Object.entries(propsToUpdate).map(([key, value]) => {
      const content = { [ActivityLog.keysContent.uuid]: chainUuid, key, value }
      const type = ActivityLog.type.chainPropUpdate
      return ActivityLogRepository.insert(user, surveyId, type, content, false, t)
    })

    // chain props and validation update
    const fields = {
      [TableChain.columnSet.props]: propsToUpdate,
      [TableChain.columnSet.validation]: Chain.getValidation(chain),
    }
    const params = { surveyId, chainUuid, dateModified: true, fields }
    updates.push(ChainRepository.updateChain(params, t))

    if (Chain.checkChangeRequiresSurveyPublish({ chainPrev: chainDb, chainNext: chain })) {
      // mark survey draft
      updates.push(markSurveyDraft(surveyId, t))
    }

    return t.batch(updates)
  })
}
