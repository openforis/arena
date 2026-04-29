import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'

import { keys } from './userKeys'

export const keysPrefs = {
  surveys: 'surveys',
  current: 'current',
  language: 'language',
} as const

export const keysSurveyPrefs = {
  cycle: ObjectUtils.keys.cycle,
  language: 'language',
} as const

const getPrefs = R.propOr({}, keys.prefs)

const pathSurveyCurrent = [keys.prefs, keysPrefs.surveys, keysPrefs.current]
const surveyPrefsPath = ({ surveyId }: { surveyId: unknown }) => [keys.prefs, keysPrefs.surveys, String(surveyId)]
const surveyPrefPath = ({ surveyId, key }: { surveyId: unknown; key: string }) => [
  ...surveyPrefsPath({ surveyId }),
  key,
]
const pathLanguage = [keys.prefs, keysPrefs.language]

const surveyCyclePrefPath = (surveyId: unknown) => surveyPrefPath({ surveyId, key: keysSurveyPrefs.cycle })
const surveyLangPrefPath = (surveyId: unknown) => surveyPrefPath({ surveyId, key: keysSurveyPrefs.language })

// ====== CREATE
export const newPrefs = ({
  surveyId = null,
  surveyCycleKey = null,
}: {
  surveyId?: unknown
  surveyCycleKey?: unknown
}) => {
  let tempUser = {}
  if (!Objects.isEmpty(surveyId)) {
    tempUser = assocPrefSurveyCurrent(surveyId)(tempUser)
  }
  if (!Objects.isEmpty(surveyCycleKey)) {
    tempUser = assocPrefSurveyCycle(surveyId, surveyCycleKey)(tempUser)
  }
  return getPrefs(tempUser)
}

// ====== READ
export const getPrefSurveyCurrent = R.path(pathSurveyCurrent)

export const getPrefSurveyCycle = (surveyId: unknown) => R.path(surveyCyclePrefPath(surveyId))
export const getPrefSurveyLang = (surveyId: unknown) => R.path(surveyLangPrefPath(surveyId))

export const getPrefSurveyCurrentCycle = (user: Record<string, unknown>) => {
  const surveyId = getPrefSurveyCurrent(user)
  return getPrefSurveyCycle(surveyId)(user)
}

export const getPrefSurveyCurrentLanguage = (user: Record<string, unknown>) => {
  const surveyId = getPrefSurveyCurrent(user)
  return getPrefSurveyLang(surveyId)(user)
}

export const getPrefLanguage = R.path(pathLanguage)

// ====== UPDATE
export const assocPrefSurveyCycle = (surveyId: unknown, cycle: unknown) =>
  R.assocPath(surveyCyclePrefPath(surveyId), cycle)
export const assocPrefSurveyLang = ({ surveyId, lang }: { surveyId: unknown; lang: string }) =>
  R.assocPath(surveyLangPrefPath(surveyId), lang)

export const assocPrefSurveyCurrent = (surveyId: unknown) => (user: Record<string, unknown>) =>
  R.pipe(
    // If the survey is selected for the first time, add the first cycle to its prefs
    R.when(R.always(R.isNil(getPrefSurveyCycle(surveyId)(user))), assocPrefSurveyCycle(surveyId, Survey.cycleOneKey)),
    R.assocPath(pathSurveyCurrent, surveyId)
  )(user)

export const assocPrefSurveyCurrentAndCycle = (surveyId: unknown, cycle: unknown) =>
  R.pipe(assocPrefSurveyCurrent(surveyId), assocPrefSurveyCycle(surveyId, cycle))

export const assocPrefLanguage = ({ lang }: { lang: string }) => R.assocPath(pathLanguage, lang)

// ====== DELETE
export const deletePrefSurvey = (surveyId: unknown) => (user: Record<string, unknown>) => {
  const surveyIdPref = getPrefSurveyCurrent(user)
  return R.pipe(
    R.when(R.always(String(surveyIdPref) === String(surveyId)), assocPrefSurveyCurrent(null)),
    R.dissocPath(surveyPrefsPath({ surveyId }))
  )(user)
}
