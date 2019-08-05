const R = require('ramda')
const StringUtils = require('../stringUtils')

const keys = {
  id: 'id',
  surveyId: 'surveyId',
  name: 'name',
  email: 'email',
  cognitoUsername: 'cognitoUsername',
  authGroups: 'authGroups',

  groupName: 'groupName',
}

// ==== User properties
const getId = R.prop(keys.id)

const getName = R.prop(keys.name)

const getEmail = R.prop(keys.email)

const getAuthGroups = R.prop(keys.authGroups)

const hasAccepted = R.pipe(
  R.propOr('', keys.cognitoUsername),
  StringUtils.isNotBlank
)

// The following methods are used in UserListView. They are meant to work on the
// object returned by the '/api/survey/:surveyId/users' entry point.
const getGroupName = R.prop(keys.groupName)

// ==== User record permissions
const getRecordPermissions = record => user =>
  R.pipe(
    getAuthGroups,
    R.find(
      R.propEq(keys.surveyId, R.prop(keys.surveyId, record))
    )
  )(user)

module.exports = {
  keys,

  getId,
  getName,
  getEmail,
  getAuthGroups,
  hasAccepted,

  getGroupName,

  getRecordPermissions,
}
