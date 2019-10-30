const R = require('ramda')

const ObjectUtils = require('@core/objectUtils')
const StringUtils = require('@core/stringUtils')
const AuthGroup = require('@core/auth/authGroup')

const keys = require('./_user/userKeys')
const UserPrefs = require('./_user/userPrefs')

//====== READ
const getName = R.propOr('', keys.name)
const getEmail = R.prop(keys.email)
const getLang = R.propOr('en', keys.lang)
const getAuthGroups = ObjectUtils.getAuthGroups
const getPrefs = R.propOr({}, keys.prefs)
const hasProfilePicture = R.propEq(keys.hasProfilePicture, true)

//====== CHECK
const isSystemAdmin = user => user && R.any(AuthGroup.isSystemAdminGroup)(getAuthGroups(user))
const hasAccepted = R.pipe(getName, StringUtils.isNotBlank)

//====== AUTH GROUP
const getAuthGroupBySurveyUuid = (surveyUuid, includeSystemAdmin = true) => user => R.pipe(
  getAuthGroups,
  R.ifElse(
    R.always(includeSystemAdmin && isSystemAdmin(user)),
    R.head,
    R.find(group => AuthGroup.getSurveyUuid(group) === surveyUuid)
  )
)(user)

const assocAuthGroup = authGroup => user => {
  const authGroups = R.pipe(getAuthGroups, R.append(authGroup))(user)
  return R.assoc(keys.authGroups, authGroups, user)
}

const dissocAuthGroup = authGroup => user => {
  const authGroups = R.pipe(
    getAuthGroups,
    R.reject(R.propEq(AuthGroup.keys.uuid, AuthGroup.getUuid(authGroup))),
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
  getAuthGroupBySurveyUuid,
  getPrefs,
  hasProfilePicture,

  //CHECK
  isSystemAdmin,
  hasAccepted,

  //AUTH GROUP
  assocAuthGroup,
  dissocAuthGroup,

  //PREFS
  newPrefs: UserPrefs.newPrefs,
  getPrefSurveyCurrent: UserPrefs.getPrefSurveyCurrent,
  getPrefSurveyCycle: UserPrefs.getPrefSurveyCycle,
  getPrefSurveyCurrentCycle: UserPrefs.getPrefSurveyCurrentCycle,

  assocPrefSurveyCurrent: UserPrefs.assocPrefSurveyCurrent,
  assocPrefSurveyCycle: UserPrefs.assocPrefSurveyCycle,
  assocPrefSurveyCurrentAndCycle: UserPrefs.assocPrefSurveyCurrentAndCycle,

  deletePrefSurvey: UserPrefs.deletePrefSurvey,
}
