const R = require('ramda')

const ObjectUtils = require('../objectUtils')
const StringUtils = require('../stringUtils')
const AuthGroups = require('../auth/authGroups')

const keys = require('./_user/userKeys')
const UserPrefs = require('./_user/userPrefs')

//====== READ
const getName = R.propOr('', keys.name)
const getEmail = R.prop(keys.email)
const getLang = R.propOr('en', keys.lang)
const getAuthGroups = R.prop(keys.authGroups)
const getPrefs = R.propOr({}, keys.prefs)
const hasProfilePicture = R.propEq(keys.hasProfilePicture, true)

//====== CHECK
const isSystemAdmin = user => user && R.any(AuthGroups.isSystemAdminGroup)(getAuthGroups(user))
const hasAccepted = R.pipe(getName, StringUtils.isNotBlank)

//====== AUTH GROUP
const assocAuthGroup = authGroup => user => {
  const authGroups = R.pipe(getAuthGroups, R.append(authGroup))(user)
  return R.assoc(keys.authGroups, authGroups, user)
}

const dissocAuthGroup = authGroup => user => {
  const authGroups = R.pipe(
    getAuthGroups,
    R.reject(R.propEq(AuthGroups.keys.uuid, AuthGroups.getUuid(authGroup))),
  )(user)
  return R.assoc(keys.authGroups, authGroups, user)
}

module.exports = {
  keys,
  keysPrefs: UserPrefs.keysPrefs,

  // READ
  isEqual: ObjectUtils.isEqual,
  getUuid: ObjectUtils.getUuid,
  getName,
  getEmail,
  getLang,
  getAuthGroups,
  getPrefs,
  hasProfilePicture,

  //CHECK
  isSystemAdmin,
  hasAccepted,

  //AUTH GROUP
  assocAuthGroup,
  dissocAuthGroup,

  //PREFS
  getPrefSurveyCurrent: UserPrefs.getPrefSurveyCurrent,
  getPrefSurveyCycle: UserPrefs.getPrefSurveyCycle,
  getPrefSurveyCurrentCycle: UserPrefs.getPrefSurveyCurrentCycle,

  assocPrefSurveyCurrent: UserPrefs.assocPrefSurveyCurrent,
  assocPrefSurveyCycle: UserPrefs.assocPrefSurveyCycle,
  assocPrefSurveyCurrentAndCycle: UserPrefs.assocPrefSurveyCurrentAndCycle,

  deletePrefSurvey: UserPrefs.deletePrefSurvey,
}
