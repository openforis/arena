const R = require('ramda')
const ObjectUtils = require('@core/objectUtils')

const keys = {
  uuid: 'uuid',
  permissions: 'permissions',
  recordSteps: 'recordSteps',
  all: 'all',
  own: 'own',
  surveyId: 'surveyId',
  surveyUuid: 'surveyUuid',
  name: 'name',
}

const permissions = {
  // surveys
  surveyCreate: 'surveyCreate',

  // only owner and administrator can delete survey
  // edit survey info props, edit nodeDefs, edit categories, edit taxonomies, publishSurvey
  surveyEdit: 'surveyEdit',

  // records
  recordCreate: 'recordCreate',
  recordEdit: 'recordEdit',
  recordView: 'recordView',
  recordCleanse: 'recordCleanse',
  recordAnalyse: 'recordAnalyse',

  // users
  userEdit: 'userEdit',
  userInvite: 'userInvite',

  // edit
  // only owner and admin - for now
  permissionsEdit: 'permissionsEdit',
}

const groupNames = {
  systemAdmin: 'systemAdmin',
  surveyAdmin: 'surveyAdmin',
  surveyEditor: 'surveyEditor',
  dataEditor: 'dataEditor',
  dataCleanser: 'dataCleanser',
  dataAnalyst: 'dataAnalyst',
  surveyGuest: 'surveyGuest',
}

const getUuid = R.prop(keys.uuid)

const getName = R.prop(keys.name)

const getSurveyUuid = R.prop(keys.surveyUuid)

const getSurveyId = R.prop(keys.surveyId)

const getPermissions = R.propOr([], keys.permissions)

const isSystemAdminGroup = R.pipe(
  getName,
  R.equals(groupNames.systemAdmin)
)

module.exports = {
  keys,
  permissions,
  groupNames,

  getUuid,
  getName,
  getSurveyId,
  getSurveyUuid,
  getPermissions,
  isSystemAdminGroup,
  isEqual: ObjectUtils.isEqual,
}
