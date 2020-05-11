import * as DB from '../../../../db'

import * as Step from '../../../../../common/analysis/processingStep'
import { TableStep } from '../../../../../common/model/db'

/**
 * Delete a processing step.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.stepUuid - The processing step.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Step>} - The result promise.
 */
export const deleteStep = async (params, client = DB.client) => {
  const { surveyId, stepUuid } = params
  const tableStep = new TableStep(surveyId)

  return client.one(
    `DELETE FROM 
        ${tableStep.nameQualified} 
    WHERE ${TableStep.columnSet.uuid} = $1
    RETURNING *`,
    [stepUuid],
    DB.transformCallback
  )
}
