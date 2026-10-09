import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'
import { ColumnNodeDef } from '@common/model/db/tables/dataNodeDef'

export type QueryResultColumn = { name: string; attribute: string; fn?: string }

/**
 * Returns the view columns of an attribute (codes with their label, taxa with their scientific name).
 * @param {object} nodeDef - The attribute definition.
 * @returns {QueryResultColumn[]} The columns.
 */
const getAttributeColumns = (nodeDef: any): QueryResultColumn[] =>
  ColumnNodeDef.getColumnNames(nodeDef).map((name: string) => ({ name, attribute: NodeDef.getName(nodeDef) }))

/**
 * Returns the aggregate columns of the measures of a query.
 * @param {object} params - Parameters.
 * @param {object} params.query - Aggregate query.
 * @param {Function} params.getDef - Returns a node def by uuid.
 * @returns {QueryResultColumn[]} One column per measure function.
 */
const getMeasureColumns = ({ query, getDef }: { query: any; getDef: (uuid: string) => any }): QueryResultColumn[] =>
  Object.entries(Query.getMeasures(query) ?? {}).flatMap(([uuid, fns]: [string, any]) => {
    const nodeDef = getDef(uuid)
    if (!nodeDef) return []
    return (fns ?? []).map((fn: string) => ({
      name: ColumnNodeDef.getColumnNameAggregateFunction({ nodeDef, aggregateFn: fn }),
      attribute: NodeDef.getName(nodeDef),
      fn,
    }))
  })

/**
 * Returns the columns of the result of a query, as the Explorer shows them.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.query - The query.
 * @returns {QueryResultColumn[]} The columns.
 */
export const getQueryResultColumns = ({ survey, query }: { survey: any; query: any }): QueryResultColumn[] => {
  const getDef = (uuid: string) => Survey.getNodeDefByUuid(uuid)(survey)
  if (Query.isModeAggregate(query)) {
    const dimensionColumns = Query.getDimensions(query).map(getDef).filter(Boolean).flatMap(getAttributeColumns)
    return [...dimensionColumns, ...getMeasureColumns({ query, getDef })]
  }
  return Query.getAttributeDefUuids(query).map(getDef).filter(Boolean).flatMap(getAttributeColumns)
}

/**
 * Converts the view rows into arrays in column order, dropping the other view columns.
 * @param {object} params - Parameters.
 * @param {object[]} params.rows - View rows.
 * @param {QueryResultColumn[]} params.columns - Result columns.
 * @returns {unknown[][]} The rows.
 */
export const toResultRows = ({ rows, columns }: { rows: Record<string, unknown>[]; columns: QueryResultColumn[] }) =>
  rows.map((row) => columns.map((column) => row[column.name] ?? null))
