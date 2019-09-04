const R = require('ramda')

const keys = {
  uuid: 'uuid',
  authGroups: 'authGroups',
  permissions: 'permissions',
  recordSteps: 'recordSteps',
  all: 'all',
  own: 'own',
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

  // users
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

const getAuthGroups = R.propOr([], keys.authGroups)

const getSurveyUuid = R.prop(keys.surveyUuid)

const getUuid = R.prop(keys.uuid)

const getName = R.prop(keys.name)

const isSystemAdminGroup =
R.pipe(
  getName,
  R.equals(groupNames.systemAdmin)
)

module.exports = {
  keys,
  permissions,
  groupNames,

  getUuid,
  getName,
  isSystemAdminGroup,
  getSurveyUuid,
  getAuthGroups,
}
