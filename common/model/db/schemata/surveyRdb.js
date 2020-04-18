import { getSchemaSurvey } from './survey'

export const getSchemaSurveyRdb = (surveyId) => `${getSchemaSurvey(surveyId)}_data`
