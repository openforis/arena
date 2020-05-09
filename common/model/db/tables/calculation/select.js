/**
 * Generate the select query for the processing_step_calculation table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {string} [params.stepUuid=null] - The step uuid to by.
 * @param {!string} [params.calculationUuid=null] - The calculation uuid to filter by.
 * @param {boolean} [params.includeScript=false] - Whether to include the R script.
 *
 * @returns {string} - The select query.
 */
export function getSelect(params) {
  const { stepUuid = null, calculationUuid = null, includeScript = false } = params

  return `SELECT ${includeScript ? this.columns : this.columnsNoScript}
    FROM ${this.nameAliased}
    ${stepUuid ? `WHERE ${this.columnStepUuid} = ${stepUuid}` : ''}
    ${calculationUuid ? `WHERE ${this.columnUuid} = ${calculationUuid}` : ''}`
}
