import { db } from '@server/db/db'
import { dbTransformCallback, getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import tableStep from './table'
import { table as tableCalculation, getSelectCalculations } from '../calculation'

export const getSelectSteps = ({ surveyId, includeCalculations, includeScript }) => {
  const colStepUuid = tableStep.addAlias(tableStep.columnSet.uuid)
  const colCalculationStepUuid = tableCalculation.addAlias(tableCalculation.columnSet.stepUuid)

  const selectFieldsStep = tableStep.columns.map((col) => tableStep.addAlias(col)).join(', ')
  const selectFieldsCalculation = tableCalculation.jsonAgg(
    tableCalculation.addAlias('*'),
    tableCalculation.columnSet.index
  )

  const selectCalculations = getSelectCalculations({ surveyId, includeScript })
  const joinCalculations = `LEFT JOIN LATERAL (${selectCalculations}) AS ${tableCalculation.alias} ON ${colStepUuid} = ${colCalculationStepUuid}`

  return `SELECT 
        ${selectFieldsStep}${includeCalculations ? `, ${selectFieldsCalculation} AS calculations` : ''}
    FROM 
        ${getSurveyDBSchema(surveyId)}.${tableStep.name} AS ${tableStep.alias}
        ${includeCalculations ? joinCalculations : ''}
        ${includeCalculations ? `GROUP BY 1` : ''}`
}

/**
 * Fetches processing steps by the given survey id.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {boolean} [params.includeCalculations=false] - Whether to include the calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include the R scripts.
 * @param {!pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchSteps = (params, client = db) => client.map(getSelectSteps(params), [], dbTransformCallback)
