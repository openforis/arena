import * as DB from '../../../../db'

import { TableStep } from '../../../../../common/model/db'
import * as Step from '../../../../../common/analysis/processingStep'

/**
 * Fetches all processing steps by the given survey id.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter by.
 * @param {string} [params.entityUuid=null] - The entity uuid to filter by.
 * @param {boolean} [params.includeCalculations=false] - Whether to include calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include calculations script.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Step[]>} - The result promise.
 */
export const fetchSteps = async (params, client = DB.client) => {
  const { surveyId, chainUuid = null, entityUuid = null, includeScript = false, includeCalculations = false } = params
  const tableStep = new TableStep(surveyId)
  return client.map(
    `${tableStep.getSelect({ chainUuid, entityUuid, includeScript, includeCalculations })}
    ORDER BY ${tableStep.columnIndex}`,
    [],
    DB.mergeProps()
  )
}

/**
 * Fetches a processing step by the given survey id and
 * one between step uuid or chainUuid-stepIndex.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter by.
 * @param {number} [params.stepIndex=null] - The step index to filter by.
 * @param {string} [params.stepUuid=null] - The step uuid to filter by.
 * @param {boolean} [params.includeCalculations=false] - Whether to include calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include calculations script.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Step | null>} - The result promise.
 */
export const fetchStep = async (params, client = DB.client) => {
  const {
    surveyId,
    chainUuid = null,
    stepIndex = null,
    stepUuid = null,
    includeScript = false,
    includeCalculations = false,
  } = params
  const byIndex = chainUuid !== null && stepIndex !== null
  const byUuid = stepUuid !== null
  if ((!byIndex && !byUuid) || (byIndex && byUuid)) {
    throw new Error('One and only one between stepUuid and chainUuid-stepIndex must be specified')
  }

  const paramsSelect = byIndex ? { chainUuid: '$1', stepIndex: '$2' } : { stepUuid: '$1' }

  const tableStep = new TableStep(surveyId)
  return client.oneOrNone(
    tableStep.getSelect({ ...paramsSelect, includeCalculations, includeScript }),
    byUuid ? [stepUuid] : [chainUuid, stepIndex],
    DB.mergeProps()
  )
}

export const fetchVariablesPrevSteps = async (params, client = DB.client) => {
  const { surveyId, entityUuid } = params

  const tableStep = new TableStep(surveyId)
  const steps = await client.map(
    `${tableStep.getSelect({ entityUuid })}
    ORDER BY ${tableStep.columnIndex}`,
    [],
    DB.mergeProps()
  )

  return steps.reduce((variablesAcc, step) => {
    variablesAcc.push(...Object.values(Step.getVariablesPreviousStep(step)))
    return variablesAcc
  }, [])
}
