import * as R from 'ramda'

import * as AuthGroups from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as DataTableReadRepository from '@server/modules/surveyRdb/repository/dataTableReadRepository'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

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

const _getAvailableActivityTypes = async (surveyId, user) => {
  if (User.isSystemAdmin(user))
    return null

  const surveyInfo = await SurveyRepository.fetchSurveyById(surveyId)

  return R.pipe(
    User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo)),
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

export const fetch = async (user, surveyId, offset, limit) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId)
  const activityTypes = await _getAvailableActivityTypes(surveyId, user)
  const activitiesDb = await ActivityLogRepository.fetch(surveyId, activityTypes, offset, limit)

  const activities = []

  for (const activity of activitiesDb) {
    if (R.includes(ActivityLog.getType(activity), [ActivityLog.type.nodeCreate, ActivityLog.type.nodeValueUpdate])) {
      const nodeHierarchyDb = ActivityLog.getParentPath(activity)
      const parentPath = []
      for (const { nodeDefUuid, nodeUuid } of nodeHierarchyDb) {
        const ancestorDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

        const keys = await DataTableReadRepository.fetchEntityKeysByRecordAndNodeDefUuid(survey, ancestorDef, ActivityLog.getRecordUuid(activity), nodeUuid)
        parentPath.push({
          nodeDefUuid,
          nodeUuid,
          keys
        })
      }
      activities.push({
        ...activity,
        [ActivityLog.keys.parentPath]: parentPath
      })
    } else {
      activities.push(activity)
    }
  }

  return activities
}

export const { insert } = ActivityLogRepository