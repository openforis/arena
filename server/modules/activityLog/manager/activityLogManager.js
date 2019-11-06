import * as R from 'ramda'

import * as AuthGroups from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'

const activityTypesCommon = [
  ActivityLog.type.surveyCreate,
]

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
  [AuthGroups.permissions.recordView]: [
    ActivityLog.type.recordCreate,
  ],
  [AuthGroups.permissions.recordEdit]: [
    ActivityLog.type.nodeCreate,
    ActivityLog.type.nodeDelete,
    ActivityLog.type.nodeValueUpdate,
    ActivityLog.type.recordStepUpdate,
    ActivityLog.type.recordDelete
  ],
  [AuthGroups.permissions.recordAnalyse]: [
    ActivityLog.type.processingChainCreate,
    ActivityLog.type.processingChainDelete,
    ActivityLog.type.processingChainPropUpdate,
    ActivityLog.type.processingStepCreate,
  ],
  [AuthGroups.permissions.userEdit]: [
    ActivityLog.type.userEdit,
  ],
  [AuthGroups.permissions.userInvite]: [
    ActivityLog.type.userInvite,
  ],
}

const _getAvailableActivityTypes = async (surveyUuid, user) => {
  if (User.isSystemAdmin(user))
    return null

  return R.pipe(
    User.getAuthGroupBySurveyUuid(surveyUuid),
    AuthGroups.getPermissions,
    //for each permission in group, get available activity types
    R.reduce(
      (accActivityTypes, permission) => {
        const activityTypes = activityTypesByPermission[permission]
        if (activityTypes)
          accActivityTypes.push(...activityTypes)
        return accActivityTypes
      },
      [...activityTypesCommon]
    )
  )(user)
}

const _canUserAccessSurvey = async (user, surveyUuid) => {
  const authGroups = await AuthGroupRepository.fetchUserGroups(User.getUuid(user))
  const userSurveyAuthGroups = R.filter(g => AuthGroup.getSurveyUuid(g) === surveyUuid)(authGroups)
  return !R.isEmpty(userSurveyAuthGroups)
}

const _transformActivityLogUser = surveyUuid => async activityLogDb => {
  const user = await UserRepository.fetchUserByUuid(ActivityLog.getContentUuid(activityLogDb))
  const canUserAccessSurvey = await _canUserAccessSurvey(user, surveyUuid)

  // assoc user email and name only if user has not been removed from survey
  return R.when(
    R.always(canUserAccessSurvey),
    R.pipe(
      R.assocPath([ActivityLog.keys.content, ActivityLog.keysContent.userEmail], User.getEmail(user)),
      R.assocPath([ActivityLog.keys.content, ActivityLog.keysContent.userName], User.getName(user)),
    ),
    activityLogDb
  )
}

export const fetch = async (user, surveyId, offset, limit) => {
  const surveyInfo = await SurveyRepository.fetchSurveyById(surveyId)
  const surveyUuid = Survey.getUuid(surveyInfo)
  const activityTypes = await _getAvailableActivityTypes(surveyUuid, user)
  const activityLogsDb = await ActivityLogRepository.fetch(surveyId, activityTypes, offset, limit)

  return await Promise.all(activityLogsDb.map(async activityLogDb => {
    if (R.includes(ActivityLog.getType(activityLogDb), [ActivityLog.type.userInvite, ActivityLog.type.userUpdate])) {
      return await _transformActivityLogUser(surveyUuid)(activityLogDb)
    } else {
      return activityLogDb
    }
  }))
}

export const { insert } = ActivityLogRepository