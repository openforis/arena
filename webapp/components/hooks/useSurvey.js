import { useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import { SurveyState } from '@webapp/store/survey'

import { useLang } from '@webapp/store/system'
import useOnUpdate from './useOnUpdate'

// ==== Survey
export const useSurvey = () => useSelector(SurveyState.getSurvey)
export const useSurveyId = () => useSelector(SurveyState.getSurveyId)
export const useSurveyInfo = () => useSelector(SurveyState.getSurveyInfo)
export const useSurveyCycleKey = () => useSelector(SurveyState.getSurveyCycleKey)
export const useSurveyLang = () => Survey.getLanguage(useLang())(useSurveyInfo())
export const useOnSurveyCycleUpdate = (effect) => {
  const surveyCycleKey = useSurveyCycleKey()
  useOnUpdate(effect, [surveyCycleKey])
}

// ==== Node defs
export const useNodeDefByUuid = (uuid) => Survey.getNodeDefByUuid(uuid)(useSurvey())

// ==== Categories
export const useCategoryByUuid = (uuid) => Survey.getCategoryByUuid(uuid)(useSurvey())
