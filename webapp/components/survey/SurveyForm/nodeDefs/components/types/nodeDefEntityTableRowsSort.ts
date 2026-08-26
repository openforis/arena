import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as CoreRecord from '@core/record/record'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'

export interface SortCriterion {
  by: string // column node def uuid
  order: 'asc' | 'desc'
}

// none -> asc -> desc -> none, cycling only the entry for `field`; other criteria are left untouched
// and keep their existing array position (their sort priority).
export const getNextSortCriteria = ({
  sortCriteria,
  field,
}: {
  sortCriteria: SortCriterion[]
  field: string
}): SortCriterion[] => {
  const index = sortCriteria.findIndex((criterion) => criterion.by === field)

  if (index < 0) {
    return [...sortCriteria, { by: field, order: 'asc' }]
  }

  const criterion = sortCriteria[index]
  if (criterion.order === 'asc') {
    const updated = [...sortCriteria]
    updated[index] = { by: field, order: 'desc' }
    return updated
  }

  return sortCriteria.filter((_criterion, criterionIndex) => criterionIndex !== index)
}

const getFormattedColumnValue = ({
  row,
  columnDef,
  survey,
  cycle,
  lang,
  record,
}: {
  row: any
  columnDef: any
  survey: any
  cycle: string
  lang: string
  record: any
}): string => {
  const childNode = CoreRecord.getNodeChildByDefUuid(row, NodeDef.getUuid(columnDef))(record)
  if (!childNode) return ''

  const value = Node.getValue(childNode, null)
  if (value === null || value === undefined || value === '') return ''

  const formatted = NodeValueFormatter.format({
    survey,
    cycle,
    nodeDef: columnDef,
    node: childNode,
    value,
    showLabel: true,
    lang,
  })
  return formatted ?? ''
}

const compareByCriterion =
  ({
    criterion,
    columnDefByUuid,
    survey,
    cycle,
    lang,
    record,
  }: {
    criterion: SortCriterion
    columnDefByUuid: Record<string, any>
    survey: any
    cycle: string
    lang: string
    record: any
  }) =>
  (rowA: any, rowB: any): number => {
    const columnDef = columnDefByUuid[criterion.by]
    const valueA = getFormattedColumnValue({ row: rowA, columnDef, survey, cycle, lang, record })
    const valueB = getFormattedColumnValue({ row: rowB, columnDef, survey, cycle, lang, record })

    // blanks always sort last, regardless of direction
    if (!valueA && !valueB) return 0
    if (!valueA) return 1
    if (!valueB) return -1

    const comparison = valueA.localeCompare(valueB, lang, { numeric: true, sensitivity: 'base' })
    return criterion.order === 'desc' ? -comparison : comparison
  }

// Partitions out placeholder rows, sorts the rest by each criterion's column's formatted value
// in turn (first non-zero comparison wins), then re-appends placeholder rows at the end.
export const sortNodes = ({
  nodes,
  sortCriteria,
  nodeDefColumns,
  survey,
  cycle,
  lang,
  record,
}: {
  nodes: any[]
  sortCriteria: SortCriterion[]
  nodeDefColumns: any[]
  survey: any
  cycle: string
  lang: string
  record: any
}): any[] => {
  if (sortCriteria.length === 0) return nodes

  const columnDefByUuid = nodeDefColumns.reduce((acc: Record<string, any>, columnDef) => {
    acc[NodeDef.getUuid(columnDef)] = columnDef
    return acc
  }, {})

  const dataRows = nodes.filter((row) => !Node.isPlaceholder(row))
  const placeholderRows = nodes.filter(Node.isPlaceholder)

  const comparators = sortCriteria.map((criterion) =>
    compareByCriterion({ criterion, columnDefByUuid, survey, cycle, lang, record })
  )

  const sortedDataRows = [...dataRows].sort((rowA, rowB) => {
    for (const comparator of comparators) {
      const result = comparator(rowA, rowB)
      if (result !== 0) return result
    }
    return 0
  })

  return [...sortedDataRows, ...placeholderRows]
}
