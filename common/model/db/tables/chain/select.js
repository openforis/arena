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
    ${this.tableStep.getSelect(selectStepsParams)}
  ) AS ${this.tableStep.alias} 
  ON TRUE`
}

/**
 * Generate the select query for the processing_chain table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {string} [params.cycle=null] - The survey cycle to filter.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter.
 * @param {boolean} [params.includeScript=false] - Whether to include R scripts.
 * @param {boolean} [params.includeStepsAndCalculations=false] - Whether to include steps and calculations.
 *
 * @returns {string} - The select query.
 */
export function getSelect(params) {
  const { cycle = null, chainUuid = null, includeScript = false, includeStepsAndCalculations = false } = params

  this.getJoinSteps = _getJoinSteps.bind(this)
  this.tableStep = new TableStep(this.surveyId)

  const selectFields = [...(includeScript ? this.columns : this.columnsNoScript)]
  if (includeStepsAndCalculations) {
    const jsonAgg = SQL.jsonAgg(this.tableStep.getColumn('*'), [this.tableStep.columnIndex])
    selectFields.push(`${jsonAgg} AS processing_steps`)
  }
  return `SELECT
        ${selectFields.join(', ')}
    FROM 
        ${this.nameFull}
    ${includeStepsAndCalculations ? this.getJoinSteps(params) : ''}
    ${cycle ? `WHERE (${this.columnProps})->'${ProcessingChain.keysProps.cycles}' @> '"${cycle}"'` : ''}
    ${chainUuid ? `WHERE ${this.columnUuid} = '${chainUuid}'` : ''}
    ${includeStepsAndCalculations ? `GROUP BY ${this.columnUuid}` : ''}`
}
