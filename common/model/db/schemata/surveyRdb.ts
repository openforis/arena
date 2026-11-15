import { getSchemaSurvey } from './survey'

export const getSchemaSurveyRdb = (surveyId: number | string): string => `${getSchemaSurvey(surveyId)}_data`
