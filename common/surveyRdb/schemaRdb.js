import { getSchemaSurveyRdb } from '@common/model/db/schemata'

export const resultTablePrefix = '_res'

/**
 * @deprecated - Use common/model/db.getSchemaSurveyRdb.
 * @param {string} surveyId - Survey id.
 */
export const getName = getSchemaSurveyRdb
