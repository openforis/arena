import { db } from '@server/db/db'
import { dbTransformCallback, getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import * as ProcessingChain from '@common/analysis/processingChain'

import tableChain from './table'
import { table as tableStep, getSelectSteps } from '../step'

const _getSelectChain = (surveyId, cycle, includeScript, includeStepsAndCalculations) => {
  const colsChain = includeScript ? tableChain.columns : tableChain.columnsNoScript
  const colChainUuid = tableChain.addAlias(tableChain.columnSet.uuid)
  const colChainProps = tableChain.addAlias(tableChain.columnSet.props)
  const colStepChainUuid = tableStep.addAlias(tableStep.columnSet.chainUuid)

  const selectFieldsChain = colsChain.map((col) => tableChain.addAlias(col)).join(', ')
  const selectFieldsSteps = tableStep.jsonAgg(tableStep.addAlias('*'), tableStep.columnSet.index)

  const selectSteps = getSelectSteps({ surveyId, includeScript, includeCalculations: includeStepsAndCalculations })
  const joinSteps = `LEFT JOIN LATERAL (${selectSteps}) AS ${tableStep.alias}  ON ${colChainUuid} = ${colStepChainUuid}`

  return `SELECT 
        ${selectFieldsChain} ${includeStepsAndCalculations ? `, ${selectFieldsSteps} AS processing_steps` : ''}
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
 * @param {pgPromise.IDatabase} [client=db] - The database client.
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
