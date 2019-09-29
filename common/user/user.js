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

//====== PREFS
const prefPathSurveyCurrent = [keys.prefs, keysPrefs.surveys, keysPrefs.current]

const getPrefSurveyCurrent = R.path(prefPathSurveyCurrent)

const setPrefSurveyCurrent = surveyId => ObjectUtils.setInPath(prefPathSurveyCurrent, surveyId)
const setPrefSurveyCycle = (surveyId, cycle) => ObjectUtils.setInPath([keys.prefs, keysPrefs.surveys, String(surveyId), keysPrefs.cycle], cycle)
const setPrefSurveyCurrentAndCycle = (surveyId, cycle) => R.pipe(
  setPrefSurveyCurrent(surveyId),
  setPrefSurveyCycle(surveyId, cycle)
)

const deletePrefSurvey = surveyId => user => {
  const surveyIdPref = getPrefSurveyCurrent(user)
  return R.pipe(
    R.when(
      R.always(String(surveyIdPref) === String(surveyId)),
      setPrefSurveyCurrent(null)
    ),
    R.dissocPath([keys.prefs, keysPrefs.surveys, String(surveyId)])
  )(user)
}

module.exports = {
  keys,
  keysPrefs,

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
  getPrefSurveyCurrent,

  setPrefSurveyCurrent,
  setPrefSurveyCycle,
  setPrefSurveyCurrentAndCycle,

  deletePrefSurvey,
}
