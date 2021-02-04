import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as DbUtils from '@server/db/dbUtils'

import * as DB from '../../../../db'
import * as Calculation from '../../../../../common/analysis/processingStepCalculation'
import { TableCalculation } from '../../../../../common/model/db'

/**
 * Create a processing step calculation.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!object} params.calculation - The processing step calculation.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Calculation>} - The result promise.
 */
export const insertCalculation = async (params, client = DB.client) => {
  const { surveyId, calculation } = params
  const tableCalculation = new TableCalculation(surveyId)

  return client.one(
    `INSERT INTO 
        ${tableCalculation.nameQualified}
        (${TableCalculation.columnSet.uuid}, 
        ${TableCalculation.columnSet.stepUuid}, 
        ${TableCalculation.columnSet.index},
        ${TableCalculation.columnSet.nodeDefUuid},
        ${TableCalculation.columnSet.props})
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      Calculation.getUuid(calculation),
      Calculation.getProcessingStepUuid(calculation),
      Calculation.getIndex(calculation),
      Calculation.getNodeDefUuid(calculation),
      Calculation.getProps(calculation),
    ],
    DB.transformCallback
  )
}

/**
 * Create a processing step calculation.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!object} params.calculation - The processing step calculation.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Calculation>} - The result promise.
 */
export const insertCalculationsInBatch = async (params, client = DB.client) => {
  const { surveyId, calculations } = params
  return client.none(
    DbUtils.insertAllQueryBatch(
      getSurveyDBSchema(surveyId),
      'processing_step_calculation',
      Object.values(TableCalculation.columnSet),
      calculations
    )
  )
}
