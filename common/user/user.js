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
  prefs: 'prefs',
}
const keysPrefs = {
  surveys: 'surveys',
  current: 'current',
  cycle: 'cycle',
}

//====== READ
const getName = R.propOr('', keys.name)
const getEmail = R.prop(keys.email)
const getLang = R.propOr('en', keys.lang)
const getAuthGroups = R.prop(keys.authGroups)
const getPrefs = R.propOr({}, keys.prefs)
const hasProfilePicture = R.propEq(keys.hasProfilePicture, true)

//====== UPDATE
const assocAuthGroup = authGroup => user => {
  const authGroups = R.pipe(getAuthGroups, R.append(authGroup))(user)
  return R.assoc(keys.authGroups, authGroups, user)
}

//====== CHECK
const isSystemAdmin = user => user && R.any(AuthGroups.isSystemAdminGroup)(getAuthGroups(user))
const hasAccepted = R.pipe(getName, StringUtils.isNotBlank)

//====== PREFS
const setPrefSurveyCurrent = surveyId => ObjectUtils.setInPath([keys.prefs, keysPrefs.surveys, keysPrefs.current], surveyId)
const setPrefSurveyCycle = (surveyId, cycle) => ObjectUtils.setInPath([keys.prefs, keysPrefs.surveys, String(surveyId), keysPrefs.cycle], cycle)
const setPrefSurveyCurrentAndCycle = (surveyId, cycle) => R.pipe(
  setPrefSurveyCurrent(surveyId),
  setPrefSurveyCycle(surveyId, cycle)
)

module.exports = {
  keys,

  // READ
  isEqual: ObjectUtils.isEqual,
  getUuid: ObjectUtils.getUuid,
  getName,
  getEmail,
  getLang,
  getAuthGroups,
  getPrefs,
  hasProfilePicture,

  //UPDATE
  assocAuthGroup,

  //CHECK
  isSystemAdmin,
  hasAccepted,

  //PREFS
  setPrefSurveyCurrent,
  setPrefSurveyCycle,
  setPrefSurveyCurrentAndCycle,
}
