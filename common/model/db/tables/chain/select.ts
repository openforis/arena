import type TableChain from './table'

export type GetSelectParams = {
  // uuid to filter by (passed as `chainUuid` query parameter)
  chainUuid?: string | null
  count?: boolean
  // include the R scripts
  includeScript?: boolean
}

const _getSelectFields = (
  table: TableChain,
  { count, includeScript }: { count: boolean; includeScript: boolean }
): string[] => {
  if (count) {
    return ['count(*)']
  }
  return [...(includeScript ? table.columns : table.columnsNoScript)]
}

// select query for the chain table (bound to a TableChain instance)
export function getSelect(this: TableChain, params: GetSelectParams): string {
  const { chainUuid = null, count = false, includeScript = false } = params

  return `SELECT
        ${_getSelectFields(this, { count, includeScript }).join(', ')}
    FROM 
        ${this.nameAliased}
    
    ${chainUuid ? `WHERE ${this.columnUuid} = $/chainUuid/` : ''}
    `
}
