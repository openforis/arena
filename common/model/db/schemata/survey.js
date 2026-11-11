/**
 * Returns the name of the DB schema of a survey.
 * @param {number|string} surveyId - The survey id.
 * @returns {string} - The schema name.
 */
export const getSchemaSurvey = (surveyId) => {
  // the schema name is used unquoted in SQL queries: the id must be an integer
  if (!/^\d+$/.test(String(surveyId))) throw new Error('Invalid survey id')
  return `survey_${surveyId}`
}
