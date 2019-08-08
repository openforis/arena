const R = require('ramda')

const keys = {
  id: 'id',
  authGroups: 'authGroups',
  permissions: 'permissions',
  recordSteps: 'recordSteps',
  all: 'all',
  own: 'own',
  surveyId: 'surveyId',
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

const getSurveyId = R.prop(keys.surveyId)

const getId = R.prop(keys.id)

const getName = R.prop(keys.name)

const isAdminGroup =
R.pipe(
  getName,
  R.equals(groupNames.systemAdmin)
)

module.exports = {
  keys,
  permissions,
  groupNames,

  getId,
  getName,
  isAdminGroup,
  getSurveyId,
  getAuthGroups,
}
