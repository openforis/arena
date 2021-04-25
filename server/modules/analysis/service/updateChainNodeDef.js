import { DB } from '@openforis/arena-server'

import * as ObjectUtils from '@core/objectUtils'
import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import { markSurveyDraft } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import { ChainNodeDefRepository } from '@server/modules/analysis/repository/chainNodeDef'

export const updateChainNodeDef = async ({ user, surveyId, chainNodeDef }) =>
  DB.tx(async (t) => {
    const chainNodeDefUuid = chainNodeDef.uuid
    const chainNodeDefDb = await ChainNodeDefRepository.getOne({ surveyId, chainNodeDefUuid }, t)
    const propsToUpdate = ObjectUtils.getPropsDiff(chainNodeDef)(chainNodeDefDb)

    // activity log for each updated prop
    const activityLogs = Object.entries(propsToUpdate).map(([key, value]) => {
      const content = {
        [ActivityLog.keysContent.uuid]: chainNodeDefUuid,
        [ActivityLog.keysContent.chainUuid]: chainNodeDef.chainUuid,
        [ActivityLog.keysContent.nodeDefUuid]: chainNodeDef.nodeDefUuid,
        key,
        value,
      }
      const type = ActivityLog.type.chainNodeDefPropUpdate
      return ActivityLogRepository.insert(user, surveyId, type, content, false, t)
    })

    return t.batch([
      ChainNodeDefRepository.update({ chainNodeDef, surveyId }, t),
      markSurveyDraft(surveyId, t),
      ...activityLogs,
    ])
  })
