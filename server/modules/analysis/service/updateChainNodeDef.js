import { DB } from '@openforis/arena-server'

import * as ObjectUtils from '@core/objectUtils'
import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import { markSurveyDraft } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import { ChainNodeDefRepository } from '@server/modules/analysis/repository/chainNodeDef'

const getActivityLog = ({ user, surveyId, chainNodeDef, key, value, t }) => {
  const content = {
    [ActivityLog.keysContent.uuid]: chainNodeDef.uuid,
    [ActivityLog.keysContent.chainUuid]: chainNodeDef.chainUuid,
    [ActivityLog.keysContent.nodeDefUuid]: chainNodeDef.nodeDefUuid,
    key,
    value,
  }
  const type = ActivityLog.type.chainNodeDefPropUpdate
  return ActivityLogRepository.insert(user, surveyId, type, content, false, t)
}

export const updateChainNodeDef = async ({ user, surveyId, chainNodeDef, newIndex = null }) =>
  DB.tx(async (t) => {
    const chainNodeDefUuid = chainNodeDef.uuid
    const chainNodeDefDb = await ChainNodeDefRepository.getOne({ surveyId, chainNodeDefUuid }, t)
    const propsToUpdate = ObjectUtils.getPropsDiff(chainNodeDef)(chainNodeDefDb)

    // activity log for each updated prop
    const activityLogs = Object.entries(propsToUpdate).map(([key, value]) =>
      getActivityLog({ user, surveyId, chainNodeDef, key, value, t })
    )
    if (newIndex !== null) {
      activityLogs.push(getActivityLog({ user, surveyId, chainNodeDef, key: 'index', value: newIndex, t }))
    }

    return t.batch([
      ChainNodeDefRepository.update({ chainNodeDef, surveyId, newIndex }, t),
      markSurveyDraft(surveyId, t),
      ...activityLogs,
    ])
  })
