import { FileFormats } from '@core/fileFormats'

export const getSurveyPath = (surveyId: number | string): string => `/survey/${surveyId}`

export const schemaSummary = ({ surveyId, cycle }: { surveyId: number | string; cycle: string }): string =>
  `${getSurveyPath(surveyId)}/schema-summary/?cycle=${cycle}&fileFormat=${FileFormats.csv}`
