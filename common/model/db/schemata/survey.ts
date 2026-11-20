// name of the DB schema of a survey
export const getSchemaSurvey = (surveyId: number | string): string => {
  // the schema name is used unquoted in SQL queries: the id must be an integer
  if (!/^\d+$/.test(String(surveyId))) throw new Error('Invalid survey id')
  return `survey_${surveyId}`
}
