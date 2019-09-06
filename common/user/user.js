const R = require('ramda')
const StringUtils = require('../stringUtils')

const AuthGroups = require('../auth/authGroups')

const keys = {
  uuid: 'uuid',
  name: 'name',
  email: 'email',
  authGroups: 'authGroups',
  hasProfilePicture: 'hasProfilePicture',
  groupName: 'groupName',
}

// ==== User properties
const isEqual = user1 => user2 => getUuid(user1) === getUuid(user2)

const getUuid = R.prop(keys.uuid)

const getName = R.prop(keys.name)

const getEmail = R.prop(keys.email)

const getAuthGroups = R.prop(keys.authGroups)

const hasProfilePicture = R.propEq(keys.hasProfilePicture, true)

const isSystemAdmin = user =>
  user &&
  R.any(AuthGroups.isSystemAdminGroup)(getAuthGroups(user))

const hasAccepted = R.pipe(
  R.propOr('', keys.name),
  StringUtils.isNotBlank
)

module.exports = {
  keys,

  isEqual,
  getUuid,
  getName,
  getEmail,
  getAuthGroups,
  hasProfilePicture,
  isSystemAdmin,
  hasAccepted,
}
