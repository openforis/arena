import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'

import { keys } from './userKeys'

export const keysPrefs = {
  surveys: 'surveys',
  current: 'current',
}

export const keysSurveyPrefs = {
  cycle: ObjectUtils.keys.cycle,
  language: 'language',
}

const pathSurveyCurrent = [keys.prefs, keysPrefs.surveys, keysPrefs.current]
const surveyPrefsPath = ({ surveyId }) => [keys.prefs, keysPrefs.surveys, String(surveyId)]
const surveyPrefPath = ({ surveyId, key }) => [...surveyPrefsPath({ surveyId }), key]

const surveyCyclePrefPath = (surveyId) => surveyPrefPath({ surveyId, key: keysSurveyPrefs.cycle })
const surveyLangPrefPath = (surveyId) => surveyPrefPath({ surveyId, key: keysSurveyPrefs.language })

// ====== CREATE
export const newPrefs = ({ surveyId = null, surveyCycleKey = null }) => {
  let obj = {}
  if (!Objects.isEmpty(surveyId)) {
    obj = assocPrefSurveyCurrent(surveyId)(obj)
  }
  if (!Objects.isEmpty(surveyCycleKey)) {
    obj = assocPrefSurveyCycle(surveyId, surveyCycleKey)(obj)
  }
  return obj[keys.prefs]
}

// ====== READ
export const getPrefSurveyCurrent = R.path(pathSurveyCurrent)

export const getPrefSurveyCycle = (surveyId) => R.path(surveyCyclePrefPath(surveyId))
export const getPrefSurveyLang = (surveyId) => R.path(surveyLangPrefPath(surveyId))

export const getPrefSurveyCurrentCycle = (user) => {
  const surveyId = getPrefSurveyCurrent(user)
  return getPrefSurveyCycle(surveyId)(user)
}

export const getPrefSurveyCurrentLanguage = (user) => {
  const surveyId = getPrefSurveyCurrent(user)
  return getPrefSurveyLang(surveyId)(user)
}

// ====== UPDATE
export const assocPrefSurveyCycle = (surveyId, cycle) => R.assocPath(surveyCyclePrefPath(surveyId), cycle)
export const assocPrefSurveyLang = ({ surveyId, lang }) => R.assocPath(surveyLangPrefPath(surveyId), lang)

export const assocPrefSurveyCurrent = (surveyId) => (user) =>
  R.pipe(
    // If the survey is selected for the first time, add the first cycle to its prefs
    R.when(R.always(R.isNil(getPrefSurveyCycle(surveyId)(user))), assocPrefSurveyCycle(surveyId, Survey.cycleOneKey)),
    R.assocPath(pathSurveyCurrent, surveyId)
  )(user)

export const assocPrefSurveyCurrentAndCycle = (surveyId, cycle) =>
  R.pipe(assocPrefSurveyCurrent(surveyId), assocPrefSurveyCycle(surveyId, cycle))

// ====== DELETE
export const deletePrefSurvey = (surveyId) => (user) => {
  const surveyIdPref = getPrefSurveyCurrent(user)
  return R.pipe(
    R.when(R.always(String(surveyIdPref) === String(surveyId)), assocPrefSurveyCurrent(null)),
    R.dissocPath(surveyPrefsPath({ surveyId }))
  )(user)
}
