import * as ProcessingChain from '@common/analysis/processingChain'

import * as SQL from '../../sql'
import TableStep from '../step'

/**
 *
 */
function _getJoinSteps({ surveyId, includeScript, includeStepsAndCalculations }) {
  const selectStepsParams = {
    surveyId,
    includeScript,
    includeCalculations: includeStepsAndCalculations,
    chainUuid: this.columnUuid,
  }
  return `LEFT JOIN LATERAL (
    ${TableStep.getSelect(selectStepsParams)}
  ) AS ${TableStep.alias} 
  ON TRUE`
}

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
export function getSelect(params) {
  const {
    surveyId,
    cycle = null,
    chainUuid = null,
    includeScript = false,
    includeStepsAndCalculations = false,
  } = params
  const getJoinSteps = _getJoinSteps.bind(this)

  const selectFields = [...(includeScript ? this.columns : this.columnsNoScript)]
  if (includeStepsAndCalculations) {
    const jsonAgg = SQL.jsonAgg(TableStep.getColumn('*'), [TableStep.columnIndex])
    selectFields.push(`${jsonAgg} AS processing_steps`)
  }
  return `SELECT
        ${selectFields.join(', ')}
    FROM 
        ${this.getSchema(surveyId)}.${this.name} AS ${this.alias}
    ${includeStepsAndCalculations ? getJoinSteps(params) : ''}
    ${cycle ? `WHERE (${this.columnProps})->'${ProcessingChain.keysProps.cycles}' @> '"${cycle}"'` : ''}
    ${chainUuid ? `WHERE ${this.columnUuid} = ${chainUuid}` : ''}
    ${includeStepsAndCalculations ? `GROUP BY ${this.columnUuid}` : ''}`
}
