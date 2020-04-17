import { db } from '@server/db/db'
import { dbTransformCallback, getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import tableChain from './table'
import { table as tableStep } from '../step'
import { table as tableCalculation } from '../calculation'

const _getSelectSteps = (surveyId, includeScript) => {
  const schema = getSurveyDBSchema(surveyId)

  const colsCalculation = includeScript ? tableCalculation.columns : tableCalculation.columnsNoScript
  const colCalculationStepUuid = tableCalculation.addAlias(tableCalculation.columnSet.stepUuid)
  const colStepUuid = tableStep.addAlias(tableStep.columnSet.uuid)

  const jsonObjectCalculation = tableCalculation.jsonBuildObject(colsCalculation)
  const jsonAggCalculations = tableCalculation.jsonAgg(jsonObjectCalculation, tableCalculation.columnSet.index)

  return `
    SELECT 
        ${tableStep.addAlias('*')}, 
        ${jsonAggCalculations} AS ${ProcessingStep.keys.calculations}
    FROM 
        ${schema}.${tableStep.name} AS ${tableStep.alias}
    LEFT OUTER JOIN 
        ${schema}.${tableCalculation.name} AS ${tableCalculation.alias}
    ON 
        ${colStepUuid} = ${colCalculationStepUuid}
    GROUP BY 1`
}

const _getSelectChain = (surveyId, cycle, includeScript, includeStepsAndCalculations) => {
  const columnsChain = includeScript ? tableChain.columns : tableChain.columnsNoScript
  const selectFieldsChain = columnsChain.map((col) => tableChain.addAlias(col)).join(', ')
  const colChainProps = tableChain.addAlias(tableChain.columnSet.props)

  const withSteps = `WITH steps AS (${_getSelectSteps(surveyId, includeScript)})`
  const selectFieldsSteps = `json_agg(${tableStep.addAlias('*')}) AS processing_steps`
  const joinSteps = `LEFT OUTER JOIN steps ${tableStep.alias}
    ON ${tableChain.addAlias(tableChain.columnSet.uuid)} = ${tableStep.addAlias(tableStep.columnSet.chainUuid)}`

  return `${includeStepsAndCalculations ? withSteps : ''}
    SELECT 
        ${selectFieldsChain}
        ${includeStepsAndCalculations ? `, ${selectFieldsSteps}` : ''}
    FROM 
        ${getSurveyDBSchema(surveyId)}.${tableChain.name} AS ${tableChain.alias}
    ${includeStepsAndCalculations ? joinSteps : ''}
    ${cycle ? `WHERE (${colChainProps})->'${ProcessingChain.keysProps.cycles}' @> '"${cycle}"'` : ''}
    ${includeStepsAndCalculations ? `GROUP BY ${selectFieldsChain}` : ''}`
}

/**
 * Fetches all processing chains by the given survey id and the optional survey cycle if present within params.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.cycle=null] - The survey cycle.
 * @param {number} [params.offset=0] - The select query offset.
 * @param {number} [params.limit=null] - The select query limit.
 * @param {boolean} [params.includeStepsAndCalculations=false] - Whether to include the processing steps and calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include the R scripts.
 * @param {pgPromise.IDatabase} client - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchChains = async (params, client = db) => {
  const {
    surveyId,
    cycle = null,
    offset = 0,
    limit = null,
    includeScript = false,
    includeStepsAndCalculations = false,
  } = params

  const chainColDateCreated = tableChain.addAlias(tableChain.columnSet.dateCreated)

  return client.map(
    `${_getSelectChain(surveyId, cycle, includeScript, includeStepsAndCalculations)}
    ORDER BY ${chainColDateCreated} DESC
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}`,
    [],
    dbTransformCallback
  )
}
