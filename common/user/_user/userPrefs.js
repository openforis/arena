const R = require('ramda')

const keys = require('./userKeys')

const keysPrefs = {
  surveys: 'surveys',
  current: 'current',
  cycle: 'cycle',
}

const pathSurveyCurrent = [keys.prefs, keysPrefs.surveys, keysPrefs.current]
const pathSurveyCycle = surveyId => [keys.prefs, keysPrefs.surveys, String(surveyId), keysPrefs.cycle]

//====== READ
const getPrefSurveyCurrent = R.path(pathSurveyCurrent)

const getPrefSurveyCycle = surveyId => R.path(pathSurveyCycle(surveyId))

//====== UPDATE
const assocPrefSurveyCurrent = surveyId => R.assocPath(pathSurveyCurrent, surveyId)

const assocPrefSurveyCycle = (surveyId, cycle) => R.assocPath(pathSurveyCycle(surveyId), cycle)

const assocPrefSurveyCurrentAndCycle = (surveyId, cycle) => R.pipe(
  assocPrefSurveyCurrent(surveyId),
  assocPrefSurveyCycle(surveyId, cycle)
)

//====== DELETE
const deletePrefSurvey = surveyId => user => {
  const surveyIdPref = getPrefSurveyCurrent(user)
  return R.pipe(
    R.when(
      R.always(String(surveyIdPref) === String(surveyId)),
      assocPrefSurveyCurrent(null)
    ),
    R.dissocPath([keys.prefs, keysPrefs.surveys, String(surveyId)])
  )(user)
}

module.exports = {
  keysPrefs,

  //READ
  getPrefSurveyCurrent,
  getPrefSurveyCycle,

  //UPDATE
  assocPrefSurveyCurrent,
  assocPrefSurveyCycle,
  assocPrefSurveyCurrentAndCycle,

  //DELETE
  deletePrefSurvey,
}