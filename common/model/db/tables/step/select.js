import * as ProcessingStep from '../../../../analysis/processingStep'
// import * as SQL from '../../sql'
import TableCalculation from '../calculation'

function _getJoinCalculation({ includeScript }) {
  return ''
  // return `LEFT JOIN LATERAL (
  //   ${this.tableCalculation.getSelect({ includeScript, stepUuid: this.columnUuid })}
  // ) AS ${this.tableCalculation.alias}
  // ON TRUE`
}

/**
 * Generate the select query for the processing_step table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter by.
 * @param {number} [params.stepIndex=null] - The step index to filter by.
 * @param {string} [params.stepUuid=null] - The step uuid to filter by.
 * @param {string} [params.entityUuid=null] - The entity uuid to filter by.
 * @param {boolean} [params.includeCalculations=false] - Whether to include calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include calculations script.
 *
 * @returns {string} - The select query.
 */
export function getSelect(params) {
  const {
    chainUuid = null,
    stepIndex = null,
    stepUuid = null,
    entityUuid = null,
    includeCalculations = false,
    includeScript = false,
  } = params
  this.getJoinCalculation = _getJoinCalculation.bind(this)
  this.tableCalculation = new TableCalculation(this.surveyId)

  const selectFields = [...this.columns]
  // if (includeCalculations) {
  //   const jsonAgg = SQL.jsonAgg(this.tableCalculation.getColumn('*'), [this.tableCalculation.columnIndex])
  //   selectFields.push(`${jsonAgg} AS calculations`)
  // }

  const whereConditions = []
  if (chainUuid) whereConditions.push(`${this.columnChainUuid} = ${chainUuid}`)
  if (stepIndex) whereConditions.push(`${this.columnIndex} = ${stepIndex}`)
  if (stepUuid) whereConditions.push(`${this.columnUuid} = ${stepUuid}`)
  if (entityUuid)
    whereConditions.push(`${this.columnProps}->'${ProcessingStep.keysProps.entityUuid}' @> '"${entityUuid}"'`)

  return `SELECT
        ${selectFields.join(', ')}
    FROM 
        ${this.nameAliased}
        ${includeCalculations ? this.getJoinCalculation({ includeScript }) : ''}
        ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''}
        ${includeCalculations ? `GROUP BY ${this.columnUuid}` : ''}`
}
