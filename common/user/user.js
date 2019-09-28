const R = require('ramda')

const ObjectUtils = require('../objectUtils')
const StringUtils = require('../stringUtils')
const AuthGroups = require('../auth/authGroups')

const keys = {
  uuid: 'uuid',
  name: 'name',
  email: 'email',
  lang: 'lang',
  authGroups: 'authGroups',
  hasProfilePicture: 'hasProfilePicture',
  groupName: 'groupName',
}

//====== READ
const getName = R.propOr('', keys.name)
const getEmail = R.prop(keys.email)
const getLang = R.propOr('en', keys.lang)
const getAuthGroups = R.prop(keys.authGroups)

const hasProfilePicture = R.propEq(keys.hasProfilePicture, true)

//====== CHECK
const isSystemAdmin = user =>
  user &&
  R.any(AuthGroups.isSystemAdminGroup)(getAuthGroups(user))

const hasAccepted = R.pipe(getName, StringUtils.isNotBlank)

module.exports = {
  keys,

  isEqual: ObjectUtils.isEqual,
  getUuid: ObjectUtils.getUuid,
  getName,
  getEmail,
  getLang,
  getAuthGroups,
  hasProfilePicture,
  isSystemAdmin,
  hasAccepted,
}
