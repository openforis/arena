import * as Chain from '@common/analysis/chain'

function _getSelectFields({ count, includeScript }) {
  if (count) {
    return ['count(*)']
  }

  const selectFields = [...(includeScript ? this.columns : this.columnsNoScript)]

  return selectFields
}

/**
 * Generate the select query for the processing_chain table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {string} [params.cycle=null] - The survey cycle to filter by.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter by.
 * @param {boolean} [params.count=false] - Whether to count.
 * @param {boolean} [params.includeScript=false] - Whether to include R scripts.
 *
 * @returns {string} - The select query.
 */
export function getSelect(params) {
  const { cycle = null, chainUuid = null, count = false, includeScript = false } = params

  this.getSelectFields = _getSelectFields.bind(this)

  return `SELECT
        ${this.getSelectFields({ count, includeScript }).join(', ')}
    FROM 
        ${this.nameAliased}
    
    ${cycle ? `WHERE (${this.columnProps})->'${Chain.keysProps.cycles}' @> '"${cycle}"'` : ''}
    ${chainUuid ? `WHERE ${this.columnUuid} = '${chainUuid}'` : ''}
    `
}
