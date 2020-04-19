import { db } from '@server/db/db'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as ResultStepView from '@common/surveyRdb/resultStepView'

/**
 * Refreshes the result step materialized view.
 *
 * @param {object} params - The query parameters.
 * @param {string} params.surveyId - The survey id.
 * @param {ResultStepView} params.resultStepView - The resultStepView to refresh.
 * @param {pgPromise.IDatabase} client - The database client.
 *
 * @returns {Promise<any>} - The promise returned from the database client.
 */
export const refreshResultStepView = async ({ surveyId, resultStepView }, client = db) =>
  client.query(
    `REFRESH MATERIALIZED VIEW ${SchemaRdb.getName(surveyId)}."${ResultStepView.getViewName(resultStepView)}"`
  )
