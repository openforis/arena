import * as SQL from '../../sql'
import TableCalculation from '../calculation'

/**
 *
 */
function _getJoinCalculation({ surveyId, includeScript }) {
  return `LEFT JOIN LATERAL (
    ${TableCalculation.getSelect({ surveyId, includeScript, stepUuid: this.columnUuid })}
  ) AS ${TableCalculation.alias}
  ON TRUE`
}

/**
 * Generate the select query for the processing_step table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter.
 * @param {boolean} [params.includeCalculations=false] - Whether to include calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include calculations script.
 *
 * @returns {string} - The select query.
 */
export function getSelect(params) {
  const { surveyId, chainUuid = null, includeCalculations = false, includeScript = false } = params
  const getJoinCalculation = _getJoinCalculation.bind(this)

  const selectFields = [...this.columns]
  if (includeCalculations) {
    const jsonAgg = SQL.jsonAgg(TableCalculation.getColumn('*'), [TableCalculation.columnIndex])
    selectFields.push(`${jsonAgg} AS calculations`)
  }

  return `SELECT
        ${selectFields.join(', ')}
    FROM 
        ${this.getSchema(surveyId)}.${this.name} AS ${this.alias}
        ${includeCalculations ? getJoinCalculation({ surveyId, includeScript }) : ''}
        ${chainUuid ? `WHERE ${this.columnChainUuid} = ${chainUuid}` : ''}
        ${includeCalculations ? `GROUP BY ${this.columnUuid}` : ''}`
}
