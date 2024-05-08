export const getSurveyPath = (surveyId) => `/survey/${surveyId}`

export const schemaSummary = ({ surveyId, cycle }) => `${getSurveyPath(surveyId)}/schema-summary/?cycle=${cycle}`
