import * as DbUtils from '@server/db/dbUtils'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import * as DB from '../../../../db'

import * as Step from '../../../../../common/analysis/processingStep'
import { TableStep } from '../../../../../common/model/db'

/**
 * Create a processing step.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!object} params.step - The processing step.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Step>} - The result promise.
 */
export const insertStep = async (params, client = DB.client) => {
  const { surveyId, step } = params
  const tableStep = new TableStep(surveyId)

  return client.one(
    `INSERT INTO 
        ${tableStep.nameQualified} 
        (${TableStep.columnSet.uuid}, ${TableStep.columnSet.chainUuid}, ${TableStep.columnSet.index}, ${TableStep.columnSet.props})
    VALUES ($1, $2, $3, $4::jsonb)
    RETURNING *`,
    [Step.getUuid(step), Step.getProcessingChainUuid(step), Step.getIndex(step), Step.getProps(step)],
    DB.transformCallback
  )
}

export const insertStepsInBatch = async (params, client = DB.client) => {
  const { surveyId, steps } = params
  return client.none(
    DbUtils.insertAllQueryBatch(
      getSurveyDBSchema(surveyId),
      TableStep.tableName,
      Object.values(TableStep.columnSet),
      steps
    )
  )
}
