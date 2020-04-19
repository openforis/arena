export const resultTablePrefix = '_res'

/**
 * @deprecated - Use common/model/db.getSchemaSurveyRdb.
 * @param {string} surveyId - Survey id.
 */
export const getName = (surveyId) => `survey_${surveyId}_data`
