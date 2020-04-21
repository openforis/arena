import { db } from '../../../../db/db'

import { ViewResultStep } from '../../../../../common/model/db'

/**
 * Refreshes the result step materialized view.
 *
 * @param {object} params - The query parameters.
 * @param {Survey} params.survey - The survey.
 * @param {ProcessingStep} params.step - The processing step to update results for.
 * @param {pgPromise.IDatabase} client - The database client.
 *
 * @returns {Promise<any>} - The promise returned from the database client.
 */
export const refreshResultStepView = async ({ survey, step }, client = db) => {
  const viewResultStep = new ViewResultStep(survey, step)

  return client.query(`REFRESH MATERIALIZED VIEW ${viewResultStep.schema}.${viewResultStep.name}`)
}
