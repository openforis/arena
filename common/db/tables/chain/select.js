import * as ProcessingChain from '@common/analysis/processingChain'

import * as SQL from '../../sql'
import * as Schemata from '../../schemata'
import * as TableStep from '../step'
import * as TableChain from './table'

const _getJoinSteps = ({ surveyId, includeScript, includeCalculations }) => {
  const selectStepsParams = { surveyId, includeScript, includeCalculations, chainUuid: TableChain.columnUuid }
  return `LEFT JOIN LATERAL (
    ${TableStep.getSelect(selectStepsParams)}
  ) AS ${TableStep.alias} 
  ON TRUE`
}

const _getConditionCycle = ({ cycle }) =>
  `(${TableChain.columnProps})->'${ProcessingChain.keysProps.cycles}' @> '"${cycle}"'`

/**
 * Generate the select query for the processing_chain table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.cycle=null] - The survey cycle to filter.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter.
 * @param {boolean} [params.includeScript=false] - Whether to include R scripts.
 * @param {boolean} [params.includeStepsAndCalculations=false] - Whether to include steps and calculations.
 *
 * @returns {string} - The select query.
 */
export const getSelect = (params) => {
  const {
    surveyId,
    cycle = null,
    chainUuid = null,
    includeScript = false,
    includeStepsAndCalculations = false,
  } = params

  const selectFieldsChain = includeScript ? TableChain.columns : TableChain.columnsNoScript
  const selectFields = [...selectFieldsChain]
  if (includeStepsAndCalculations) {
    const jsonAgg = SQL.jsonAgg(SQL.addAlias(TableStep.alias, '*'), [TableStep.columnIndex])
    selectFields.push(`${jsonAgg} AS processing_steps`)
  }

  return `SELECT
        ${selectFields.join(', ')}
    FROM 
         ${Schemata.getSchemaNameSurvey(surveyId)}.${TableChain.name} AS ${TableChain.alias}
    ${
      includeStepsAndCalculations
        ? _getJoinSteps({ surveyId, includeScript, includeCalculations: includeStepsAndCalculations })
        : ''
    }         
    ${cycle ? `WHERE ${_getConditionCycle({ cycle })}` : ''}
    ${chainUuid ? `WHERE ${TableChain.columnUuid} = ${chainUuid}` : ''}
    ${includeStepsAndCalculations ? `GROUP BY ${selectFieldsChain}` : ''}`
}
