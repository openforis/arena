import * as R from 'ramda'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: 'uuid',
  permissions: 'permissions',
  recordSteps: 'recordSteps',
  all: 'all',
  own: 'own',
  surveyId: 'surveyId',
  surveyUuid: 'surveyUuid',
  name: 'name',
}

export const permissions = {
  // Surveys
  surveyCreate: 'surveyCreate',

  // Only owner and administrator can delete survey
  // edit survey info props, edit nodeDefs, edit categories, edit taxonomies, publishSurvey
  surveyEdit: 'surveyEdit',

  // Records
  recordCreate: 'recordCreate',
  recordEdit: 'recordEdit',
  recordView: 'recordView',
  recordCleanse: 'recordCleanse',
  recordAnalyse: 'recordAnalyse',

  // Users
  userEdit: 'userEdit',
  userInvite: 'userInvite',

  // Edit
  // only owner and admin - for now
  permissionsEdit: 'permissionsEdit',
}

export const groupNames = {
  systemAdmin: 'systemAdmin',
  surveyAdmin: 'surveyAdmin',
  surveyEditor: 'surveyEditor',
  dataEditor: 'dataEditor',
  dataCleanser: 'dataCleanser',
  dataAnalyst: 'dataAnalyst',
  surveyGuest: 'surveyGuest',
}

export const getUuid = R.prop(keys.uuid)

export const getName = R.prop(keys.name)

export const getSurveyUuid = R.prop(keys.surveyUuid)

export const getSurveyId = R.prop(keys.surveyId)

export const getPermissions = R.propOr([], keys.permissions)

export const getRecordSteps = R.propOr([], keys.recordSteps)

export const getRecordEditLevel = step => R.pipe(getRecordSteps, R.prop(step))

export const isSystemAdminGroup = R.pipe(getName, R.equals(groupNames.systemAdmin))

export const isEqual = ObjectUtils.isEqual
