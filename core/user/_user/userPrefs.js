import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'

import { keys } from './userKeys'

export const keysPrefs = {
  surveys: 'surveys',
  current: 'current',
  cycle: ObjectUtils.keys.cycle,
}

const pathSurveyCurrent = [keys.prefs, keysPrefs.surveys, keysPrefs.current]
const pathSurveyCycle = surveyId => [keys.prefs, keysPrefs.surveys, String(surveyId), keysPrefs.cycle]

// ====== CREATE
export const newPrefs = (surveyId, surveyCycleKey) => ({
  [keysPrefs.surveys]: {
    [keysPrefs.current]: surveyId,
    [surveyId]: {
      [keysPrefs.cycle]: surveyCycleKey,
    },
  },
})

// ====== READ
export const getPrefSurveyCurrent = R.path(pathSurveyCurrent)

export const getPrefSurveyCycle = surveyId => R.path(pathSurveyCycle(surveyId))

export const getPrefSurveyCurrentCycle = user =>
  R.pipe(getPrefSurveyCurrent, surveyId => getPrefSurveyCycle(surveyId)(user))(user)

// ====== UPDATE
export const assocPrefSurveyCycle = (surveyId, cycle) => R.assocPath(pathSurveyCycle(surveyId), cycle)

export const assocPrefSurveyCurrent = surveyId => user =>
  R.pipe(
    // If the survey is selected for the first time, add the first cycle to its prefs
    R.when(R.always(R.isNil(getPrefSurveyCycle(surveyId)(user))), assocPrefSurveyCycle(surveyId, Survey.cycleOneKey)),
    R.assocPath(pathSurveyCurrent, surveyId),
  )(user)

export const assocPrefSurveyCurrentAndCycle = (surveyId, cycle) =>
  R.pipe(assocPrefSurveyCurrent(surveyId), assocPrefSurveyCycle(surveyId, cycle))

// ====== DELETE
export const deletePrefSurvey = surveyId => user => {
  const surveyIdPref = getPrefSurveyCurrent(user)
  return R.pipe(
    R.when(R.always(String(surveyIdPref) === String(surveyId)), assocPrefSurveyCurrent(null)),
    R.dissocPath([keys.prefs, keysPrefs.surveys, String(surveyId)]),
  )(user)
}
