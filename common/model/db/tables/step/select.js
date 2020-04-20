import * as ProcessingStep from '../../../../analysis/processingStep'
import * as SQL from '../../sql'
import TableCalculation from '../calculation'

function _getJoinCalculation({ includeScript }) {
  return `LEFT JOIN LATERAL (
    ${this.tableCalculation.getSelect({ includeScript, stepUuid: this.columnUuid })}
  ) AS ${this.tableCalculation.alias}
  ON TRUE`
}

/**
 * Generate the select query for the processing_step table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter for.
 * @param {string} [params.stepUuid=null] - The step uuid to filter for.
 * @param {string} [params.entityUuid=null] - The entity uuid to filter for.
 * @param {boolean} [params.includeCalculations=false] - Whether to include calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include calculations script.
 *
 * @returns {string} - The select query.
 */
export function getSelect(params) {
  const {
    chainUuid = null,
    stepUuid = null,
    entityUuid = null,
    includeCalculations = false,
    includeScript = false,
  } = params
  this.getJoinCalculation = _getJoinCalculation.bind(this)
  this.tableCalculation = new TableCalculation(this.surveyId)

  const selectFields = [...this.columns]
  if (includeCalculations) {
    const jsonAgg = SQL.jsonAgg(this.tableCalculation.getColumn('*'), [this.tableCalculation.columnIndex])
    selectFields.push(`${jsonAgg} AS calculations`)
  }

  return `SELECT
        ${selectFields.join(', ')}
    FROM 
        ${this.nameFull}
        ${includeCalculations ? this.getJoinCalculation({ includeScript }) : ''}
        ${chainUuid ? `WHERE ${this.columnChainUuid} = ${chainUuid}` : ''}
        ${stepUuid ? `WHERE ${this.columnUuid} = ${stepUuid}` : ''}
        ${entityUuid ? `WHERE ${this.columnProps}->'${ProcessingStep.keysProps.entityUuid}' @> '"${entityUuid}"'` : ''}
        ${includeCalculations ? `GROUP BY ${this.columnUuid}` : ''}`
}
