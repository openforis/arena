import { db } from '../../../../db/db'

import { ResultStepView } from '../../../../../common/model/db'

/**
 * Creates the result step materialized view.
 *
 * @param {object} params - The query parameters.
 * @param {Survey} params.survey - The survey.
 * @param {ProcessingStep} params.step - The step to create the result view for.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any>} - The result promise.
 */
export const createResultStepView = async ({ survey, step }, client = db) => {
  const resultStepView = new ResultStepView(survey, step)
  return client.query(resultStepView.getCreate())
}
