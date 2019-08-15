const R = require('ramda')
const StringUtils = require('../stringUtils')
const AuthGroups = require('../auth/authGroups')

const keys = {
  uuid: 'uuid',
  surveyId: 'surveyId',
  name: 'name',
  email: 'email',
  authGroups: 'authGroups',

  groupName: 'groupName',
}

// ==== User properties
const getUuid = R.prop(keys.uuid)

const getName = R.prop(keys.name)

const getEmail = R.prop(keys.email)

const getAuthGroups = R.prop(keys.authGroups)

const hasAccepted = R.pipe(
  R.propOr('', keys.name),
  StringUtils.isNotBlank
)

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

  getUuid,
  getName,
  getEmail,
  getAuthGroups,
  hasAccepted,

  getRecordPermissions,
}
