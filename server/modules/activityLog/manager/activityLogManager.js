import * as R from 'ramda'

import * as AuthGroups from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as DataTableReadRepository from '@server/modules/surveyRdb/repository/dataTableReadRepository'

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

const _addNodeParentPathKeys = async (survey, activity) => {
  const recordUuid = ActivityLog.getContentRecordUuid(activity)
  const nodeHierarchyDb = ActivityLog.getParentPath(activity)

  const ancestorKeys = await Promise.all(nodeHierarchyDb.map(
    ({ nodeDefUuid, nodeUuid }) =>
      R.isNil(nodeDefUuid) || R.isNil(nodeUuid)
        ? null
        : DataTableReadRepository.fetchEntityKeysByRecordAndNodeDefUuid(survey, nodeDefUuid, recordUuid, nodeUuid)
  ))

  const parentPath = R.zipWith((parentPathDb, keys) => ({ ...parentPathDb, keys }), nodeHierarchyDb, ancestorKeys)

  return {
    ...activity,
    [ActivityLog.keys.parentPath]: parentPath
  }
}

export const fetch = async (user, surveyId, offset, limit) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const activityTypes = await _getAvailableActivityTypes(Survey.getUuid(surveyInfo), user)
  const activitiesDb = await ActivityLogRepository.fetch(surveyInfo, activityTypes, offset, limit)

  return await Promise.all(activitiesDb.map(activity =>
    R.includes(ActivityLog.getType(activity), [ActivityLog.type.nodeCreate, ActivityLog.type.nodeValueUpdate, ActivityLog.type.nodeDelete])
      ? _addNodeParentPathKeys(survey, activity)
      : activity
  ))
}

export const { insert } = ActivityLogRepository
