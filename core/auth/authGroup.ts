import * as R from 'ramda'

import { UserAuthGroup } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  recordSteps: 'recordSteps',
  all: 'all',
  own: 'own',
  surveyId: 'surveyId',
  surveyUuid: 'surveyUuid',
  name: ObjectUtils.keys.name,
} as const

export const permissions = {
  surveyCreate: 'surveyCreate',
  surveyEdit: 'surveyEdit',
  recordCreate: 'recordCreate',
  recordEdit: 'recordEdit',
  recordView: 'recordView',
  recordCleanse: 'recordCleanse',
  recordAnalyse: 'recordAnalyse',
  userEdit: 'userEdit',
  userInvite: 'userInvite',
  permissionsEdit: 'permissionsEdit',
} as const

export const groupNames = {
  systemAdmin: 'systemAdmin',
  surveyManager: 'surveyManager',
  surveyAdmin: 'surveyAdmin',
  surveyEditor: 'surveyEditor',
  dataEditor: 'dataEditor',
  dataCleanser: 'dataCleanser',
  dataAnalyst: 'dataAnalyst',
  surveyGuest: 'surveyGuest',
} as const

export const surveyGroupNames = [
  groupNames.surveyAdmin,
  groupNames.surveyEditor,
  groupNames.dataEditor,
  groupNames.dataCleanser,
  groupNames.dataAnalyst,
  groupNames.surveyGuest,
]

export const permissionsByGroupName = {
  [groupNames.systemAdmin]: Object.values(permissions),
  [groupNames.surveyManager]: [
    permissions.permissionsEdit,
    permissions.surveyCreate,
    permissions.surveyEdit,
    permissions.recordView,
    permissions.recordCreate,
    permissions.recordEdit,
    permissions.recordCleanse,
    permissions.recordAnalyse,
    permissions.userEdit,
    permissions.userInvite,
  ],
  [groupNames.surveyAdmin]: [
    permissions.permissionsEdit,
    permissions.surveyEdit,
    permissions.recordView,
    permissions.recordCreate,
    permissions.recordEdit,
    permissions.recordCleanse,
    permissions.recordAnalyse,
    permissions.userEdit,
    permissions.userInvite,
  ],
  [groupNames.surveyEditor]: [
    permissions.surveyEdit,
    permissions.recordView,
    permissions.recordCreate,
    permissions.recordEdit,
    permissions.recordCleanse,
    permissions.recordAnalyse,
  ],
  [groupNames.dataAnalyst]: [
    permissions.recordView,
    permissions.recordCreate,
    permissions.recordEdit,
    permissions.recordCleanse,
    permissions.recordAnalyse,
  ],
  [groupNames.dataCleanser]: [
    permissions.recordView,
    permissions.recordCreate,
    permissions.recordEdit,
    permissions.recordCleanse,
  ],
  [groupNames.dataEditor]: [permissions.recordView, permissions.recordCreate, permissions.recordEdit],
}

const sortedGroupNames = [
  groupNames.systemAdmin,
  groupNames.surveyManager,
  groupNames.surveyAdmin,
  groupNames.surveyEditor,
  groupNames.dataAnalyst,
  groupNames.dataCleanser,
  groupNames.dataEditor,
  groupNames.surveyGuest,
]

export const getUuid = R.prop(keys.uuid)

export const getName = R.prop(keys.name)

export const getSurveyUuid = R.prop(keys.surveyUuid)

export const getSurveyId = R.prop(keys.surveyId)

export const getPermissions = (group: UserAuthGroup): string[] =>
  permissionsByGroupName[getName(group) as keyof typeof permissionsByGroupName] ?? []

export const getRecordSteps = R.propOr([], keys.recordSteps)

export const getRecordEditLevel = (step: string) => R.pipe(getRecordSteps, R.prop(step))

export const isSystemAdminGroup = (group: UserAuthGroup): boolean => getName(group) === groupNames.systemAdmin

export const isSurveyManagerGroup = (group: UserAuthGroup): boolean => getName(group) === groupNames.surveyManager

export const isSurveyGroup = (group: UserAuthGroup): boolean =>
  !isSystemAdminGroup(group) && !isSurveyManagerGroup(group)

export const { isEqual } = ObjectUtils

export const sortGroups = (groups: UserAuthGroup[]): UserAuthGroup[] => {
  const sortedGroups = [...groups]
  sortedGroups.sort((group1, group2) => {
    const sortOrder1 = sortedGroupNames.indexOf(getName(group1) as (typeof sortedGroupNames)[number])
    const sortOrder2 = sortedGroupNames.indexOf(getName(group2) as (typeof sortedGroupNames)[number])
    return sortOrder1 - sortOrder2
  })
  return sortedGroups
}
