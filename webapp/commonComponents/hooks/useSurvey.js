import { useSelector } from 'react-redux'

import * as SurveyState from '@webapp/survey/surveyState'

export const useSurvey = () => useSelector(SurveyState.getSurvey)
export const useSurveyInfo = () => useSelector(SurveyState.getSurveyInfo)
export const useSurveyCycleKey = () => useSelector(SurveyState.getSurveyCycleKey)
