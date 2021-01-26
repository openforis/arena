import * as R from 'ramda'

import * as AuthGroups from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

const activityTypesCommon = [ActivityLog.type.surveyCreate]

const activityTypesByPermission = {
  [AuthGroups.permissions.surveyEdit]: [
    ActivityLog.type.surveyPropUpdate,
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
    ActivityLog.type.processingChainCreate,
    ActivityLog.type.processingChainDelete,
    ActivityLog.type.processingChainPropUpdate,
    ActivityLog.type.processingStepCreate,
  ],
  [AuthGroups.permissions.userEdit]: [ActivityLog.type.userEdit],
  [AuthGroups.permissions.userInvite]: [ActivityLog.type.userInvite],
}

const _getAvailableActivityTypes = async (surveyUuid, user) => {
  if (User.isSystemAdmin(user)) {
    return null
  }

  return R.pipe(
    User.getAuthGroupBySurveyUuid(surveyUuid),
    AuthGroups.getPermissions,
    // For each permission in group, get available activity types
    R.reduce(
      (accActivityTypes, permission) => {
        const activityTypes = activityTypesByPermission[permission]
        if (activityTypes) {
          accActivityTypes.push(...activityTypes)
        }

        return accActivityTypes
      },
      [...activityTypesCommon]
    )
  )(user)
}

export const fetch = async ({ user, surveyId, idGreaterThan, idLessThan, limit }) => {
  const surveyInfo = await SurveyRepository.fetchSurveyById(surveyId)
  const activityTypes = await _getAvailableActivityTypes(Survey.getUuid(surveyInfo), user)
  return ActivityLogRepository.fetch({ surveyInfo, activityTypes, idGreaterThan, idLessThan, limit })
}

export const { insert } = ActivityLogRepository
