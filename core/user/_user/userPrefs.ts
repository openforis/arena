import * as A from '@core/arena'

import { Objects } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'

import { keys } from './userKeys'

export const keysPrefs = {
  surveys: 'surveys',
  current: 'current',
  language: 'language',
  notifyOnUserAccessRequest: 'notifyOnUserAccessRequest',
} as const

export const keysSurveyPrefs = {
  cycle: ObjectUtils.keys.cycle,
  language: 'language',
} as const

const getPrefs = A.propOr({}, keys.prefs)

const pathSurveyCurrent = [keys.prefs, keysPrefs.surveys, keysPrefs.current]
const surveyPrefsPath = ({ surveyId }: { surveyId: unknown }) => [keys.prefs, keysPrefs.surveys, String(surveyId)]
const surveyPrefPath = ({ surveyId, key }: { surveyId: unknown; key: string }) => [
  ...surveyPrefsPath({ surveyId }),
  key,
]
const pathLanguage = [keys.prefs, keysPrefs.language]
const pathNotifyOnUserAccessRequest = [keys.prefs, keysPrefs.notifyOnUserAccessRequest]

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
export const getPrefSurveyCurrent = A.path(pathSurveyCurrent)

export const getPrefSurveyCycle = (surveyId: unknown) => A.path(surveyCyclePrefPath(surveyId))
export const getPrefSurveyLang = (surveyId: unknown) => A.path(surveyLangPrefPath(surveyId))

export const getPrefSurveyCurrentCycle = (user: Record<string, unknown>) => {
  const surveyId = getPrefSurveyCurrent(user)
  return getPrefSurveyCycle(surveyId)(user)
}

export const getPrefSurveyCurrentLanguage = (user: Record<string, unknown>) => {
  const surveyId = getPrefSurveyCurrent(user)
  return getPrefSurveyLang(surveyId)(user)
}

export const getPrefLanguage = A.path(pathLanguage)

// defaults to true: an unset pref must behave like "notify", preserving pre-existing behaviour
export const getPrefNotifyOnUserAccessRequest = (user: Record<string, unknown>): boolean =>
  A.pathOr(true, pathNotifyOnUserAccessRequest, user) as boolean

// ====== UPDATE
export const assocPrefSurveyCycle = (surveyId: unknown, cycle: unknown) =>
  A.assocPath(surveyCyclePrefPath(surveyId), cycle)
export const assocPrefSurveyLang = ({ surveyId, lang }: { surveyId: unknown; lang: string }) =>
  A.assocPath(surveyLangPrefPath(surveyId), lang)

export const assocPrefSurveyCurrent = (surveyId: unknown) => (user: Record<string, unknown>) =>
  A.pipe(
    // If the survey is selected for the first time, add the first cycle to its prefs
    A.when(A.always(A.isNil(getPrefSurveyCycle(surveyId)(user))), assocPrefSurveyCycle(surveyId, Survey.cycleOneKey)),
    A.assocPath(pathSurveyCurrent, surveyId)
  )(user)

export const assocPrefSurveyCurrentAndCycle = (surveyId: unknown, cycle: unknown) =>
  A.pipe(assocPrefSurveyCurrent(surveyId), assocPrefSurveyCycle(surveyId, cycle))

export const assocPrefLanguage = ({ lang }: { lang: string }) => A.assocPath(pathLanguage, lang)

export const assocPrefNotifyOnUserAccessRequest = (value: boolean) => A.assocPath(pathNotifyOnUserAccessRequest, value)

// ====== DELETE
export const deletePrefSurvey = (surveyId: unknown) => (user: Record<string, unknown>) => {
  const surveyIdPref = getPrefSurveyCurrent(user)
  return A.pipe(
    A.when(A.always(String(surveyIdPref) === String(surveyId)), assocPrefSurveyCurrent(null)),
    A.dissocPath(surveyPrefsPath({ surveyId }))
  )(user)
}
