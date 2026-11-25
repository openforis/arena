import type { ArenaUser } from '@openforis/arena-core'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as AuthGroups from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'

const activityTypesCommon = [ActivityLog.type.surveyCreate]

const activityTypesByPermission: Record<string, string[]> = {
  [AuthGroups.permissions.surveyEdit]: [
    ActivityLog.type.surveyPropUpdate,
    ActivityLog.type.surveyAiPolicyUpdate,
    ActivityLog.type.surveyPublish,
    ActivityLog.type.nodeDefCreate,
    ActivityLog.type.nodeDefUpdate,
    ActivityLog.type.nodeDefMarkDeleted,
    ActivityLog.type.categoryDelete,
    ActivityLog.type.categoryImport,
    ActivityLog.type.categoryInsert,
    ActivityLog.type.categoryPropUpdate,
    ActivityLog.type.categoryItemDelete,
    ActivityLog.type.categoryItemInsert,
    ActivityLog.type.categoryItemPropUpdate,
    ActivityLog.type.categoryLevelDelete,
    ActivityLog.type.categoryLevelInsert,
    ActivityLog.type.categoryLevelPropUpdate,
    ActivityLog.type.taxonomyCreate,
    ActivityLog.type.taxonomyDelete,
    ActivityLog.type.taxonomyPropUpdate,
    ActivityLog.type.taxonomyTaxaImport,
  ],
  [AuthGroups.permissions.recordView]: [ActivityLog.type.recordCreate],
  [AuthGroups.permissions.recordEdit]: [
    ActivityLog.type.nodeCreate,
    ActivityLog.type.nodeDelete,
    ActivityLog.type.nodeValueUpdate,
    ActivityLog.type.recordStepUpdate,
    ActivityLog.type.recordDelete,
  ],
  [AuthGroups.permissions.recordAnalyse]: [
    ActivityLog.type.chainCreate,
    ActivityLog.type.chainDelete,
    ActivityLog.type.chainPropUpdate,
  ],
  [AuthGroups.permissions.userEdit]: [ActivityLog.type.userUpdate],
  [AuthGroups.permissions.userInvite]: [ActivityLog.type.userInvite],
}

// null for system admins (all activity types)
const _getAvailableActivityTypes = (surveyUuid: string, user: ArenaUser): string[] | null => {
  if (User.isSystemAdmin(user)) {
    return null
  }
  const authGroup = User.getAuthGroupBySurveyUuid({ surveyUuid })(user)
  const activityTypes = [...activityTypesCommon]
  for (const permission of AuthGroups.getPermissions(authGroup)) {
    activityTypes.push(...(activityTypesByPermission[permission] ?? []))
  }
  return activityTypes
}

export const fetch = async ({
  user,
  surveyId,
  idGreaterThan,
  idLessThan,
  limit,
  orderBy,
}: {
  user: ArenaUser
  surveyId: number
  idGreaterThan?: number | null
  idLessThan?: number | null
  limit?: number | null
  orderBy?: string
}) => {
  const surveyInfo = await SurveyRepository.fetchSurveyById({ surveyId })
  const activityTypes = _getAvailableActivityTypes(Survey.getUuid(surveyInfo), user)
  return ActivityLogRepository.fetch({ surveyInfo, activityTypes, idGreaterThan, idLessThan, limit, orderBy })
}

export const { count, fetchSimple, fetchTableSize, insert, insertMany, deleteAll } = ActivityLogRepository
