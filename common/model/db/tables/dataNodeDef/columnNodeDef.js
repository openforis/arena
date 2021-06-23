import * as R from 'ramda'
import camelize from 'camelize'
import * as toSnakeCase from 'to-snake-case'

import * as NodeDef from '../../../../../core/survey/nodeDef'
import { Query } from '../../../query'

import * as SQL from '../../sql'

const { nodeDefType } = NodeDef

const columnNamesSuffixByType = {
  [nodeDefType.code]: ['code', 'label'],
  [nodeDefType.taxon]: ['code', 'scientific_name'],
  [nodeDefType.file]: ['file_uuid', 'file_name'],
}

const colTypesByType = {
  [nodeDefType.boolean]: [SQL.types.varchar],
  [nodeDefType.code]: [SQL.types.varchar, SQL.types.varchar],
  [nodeDefType.coordinate]: [SQL.types.geometryPoint],
  [nodeDefType.date]: [SQL.types.date],
  [nodeDefType.decimal]: [SQL.types.decimal],
  [nodeDefType.entity]: [SQL.types.uuid],
  [nodeDefType.file]: [SQL.types.uuid, SQL.types.varchar],
  [nodeDefType.integer]: [SQL.types.bigint],
  [nodeDefType.taxon]: [SQL.types.varchar, SQL.types.varchar],
  [nodeDefType.text]: [SQL.types.varchar],
  [nodeDefType.time]: [SQL.types.time],
}

const getColumnNames = (nodeDef) => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const colsSuffix = columnNamesSuffixByType[NodeDef.getType(nodeDef)]
  if (colsSuffix) {
    return colsSuffix.map((col) => `${nodeDefName}_${col}`)
  }
  if (NodeDef.isEntity(nodeDef)) {
    return [`${nodeDefName}_uuid`]
  }
  return [nodeDefName]
}

const extractColumnName = ({ nodeDef, columnName }) =>
  camelize(columnName.replace(`${toSnakeCase(NodeDef.getName(nodeDef))}_`, ''))

/**
 * A nodeDef data table column.
 *
 * @typedef {object} module:arena.ColumnNodeDef
 */
export default class ColumnNodeDef {
  constructor(table, nodeDef) {
    this._table = table
    this._nodeDef = nodeDef
    this._names = getColumnNames(nodeDef)
    this._types = colTypesByType[NodeDef.getType(nodeDef)]
  }

  get table() {
    return this._table
  }

  get nodeDef() {
    return this._nodeDef
  }

  get names() {
    return this._names
  }

  get name() {
    return this.names[0]
  }

  get namesFull() {
    return SQL.addAlias(this.table.alias, this.names)
  }

  get nameFull() {
    return this.namesFull[0]
  }

  get types() {
    return this._types
  }
}

ColumnNodeDef.getColumnNames = getColumnNames
ColumnNodeDef.getColumnName = R.pipe(ColumnNodeDef.getColumnNames, R.head)
ColumnNodeDef.getColumnNameAggregateFunction = ({ nodeDef, aggregateFn }) => {
  const columnName = ColumnNodeDef.getColumnName(nodeDef)
  if (Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS).includes(aggregateFn)) {
    return `${columnName}_${aggregateFn}`
  }
  // custom aggregate function
  const customAggregateFunction = NodeDef.getAggregateFunctionByUuid(aggregateFn)(nodeDef)
  return `${columnName}_custom_agg_${customAggregateFunction.name}`
}
ColumnNodeDef.extractColumnName = extractColumnName
