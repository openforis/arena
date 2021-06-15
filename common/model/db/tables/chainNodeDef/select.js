import * as ProcessingChainNodeDef from '../../../../analysis/processingChainNodeDef'
// import * as SQL from '../../sql'

/**
 * Generate the select query for the processing_step table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter by.
 * @param {number} [params.stepIndex=null] - The step index to filter by.
 * @param {string} [params.stepUuid=null] - The step uuid to filter by.
 * @param {string} [params.entityUuid=null] - The entity uuid to filter by.
 *
 * @returns {string} - The select query.
 */
export function getSelect(params) {
  const { chainUuid = null, stepIndex = null, stepUuid = null, entityUuid = null } = params

  const selectFields = [...this.columns]

  const whereConditions = []
  if (chainUuid) whereConditions.push(`${this.columnChainUuid} = ${chainUuid}`)
  if (stepIndex) whereConditions.push(`${this.columnIndex} = ${stepIndex}`)
  if (stepUuid) whereConditions.push(`${this.columnUuid} = ${stepUuid}`)
  if (entityUuid)
    whereConditions.push(`${this.columnProps}->'${ProcessingChainNodeDef.keysProps.entityUuid}' @> '"${entityUuid}"'`)

  return `SELECT
        ${selectFields.join(', ')}
    FROM 
        ${this.nameAliased}
        
        ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''}
        `
}
