import * as R from 'ramda'
import camelize from 'camelize'
import * as toSnakeCase from 'to-snake-case'

import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as SQL from '../../sql'

const { nodeDefType } = NodeDef

const colNamesSuffixByType = {
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

const getColNames = (nodeDef) => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const colsSuffix = colNamesSuffixByType[NodeDef.getType(nodeDef)]
  if (colsSuffix) {
    return colsSuffix.map((col) => `${nodeDefName}_${col}`)
  }
  if (NodeDef.isEntity(nodeDef)) {
    return [`${nodeDefName}_uuid`]
  }
  return [nodeDefName]
}

const extractColName = ({ nodeDef, colName }) =>
  camelize(colName.replace(`${toSnakeCase(NodeDef.getName(nodeDef))}_`, ''))

const shouldReturnBooleanColumnWithLabel = ({ nodeDef, streamMode }) =>
  NodeDef.isBoolean(nodeDef) &&
  NodeDef.getAnswerLabelsType(nodeDef) === NodeDef.booleanAnswerLabelsTypes.yesNo &&
  streamMode

/**
 * A nodeDef data table column.
 *
 * @typedef {object} module:arena.ColumnNodeDef
 */
export default class ColumnNodeDef {
  constructor(table, nodeDef, streamMode = false) {
    this._table = table
    this._nodeDef = nodeDef
    this._names = getColNames(nodeDef)
    this._types = colTypesByType[NodeDef.getType(nodeDef)]
    this._streamMode = streamMode
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
    if (shouldReturnBoolenColumnWithLabel({ nodeDef: this._nodeDef, streamMode: this._streamMode })) {
      return `CASE WHEN ${SQL.addAlias(this.table.alias, this.names)}::boolean = True THEN 'Yes' ELSE 'No' END as ${
        this.names
      }`
    }
    return SQL.addAlias(this.table.alias, this.names)
  }

  get nameFull() {
    return this.namesFull[0]
  }

  get types() {
    return this._types
  }
}

ColumnNodeDef.getColNames = getColNames
ColumnNodeDef.getColName = R.pipe(ColumnNodeDef.getColNames, R.head)
ColumnNodeDef.extractColName = extractColName
