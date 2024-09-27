import * as R from 'ramda'
import toSnakeCase from 'to-snake-case'

import * as NodeDef from '../../../../../core/survey/nodeDef'
import { Query } from '../../../query'

import * as SQL from '../../sql'

const { nodeDefType } = NodeDef

const columnSuffixCodeLabel = '_label'
const columnSuffixTaxonScientificName = '_scientific_name'
const columnSuffixTaxonVernacularName = '_vernacular_name'

const columnNamesSuffixGetterByType = {
  [nodeDefType.code]: () => ['', columnSuffixCodeLabel],
  [nodeDefType.coordinate]: ({ nodeDef }) => {
    const suffixes = ['', '_x', '_y', '_srs']
    const additionalFields = NodeDef.getCoordinateAdditionalFields(nodeDef)
    suffixes.push(...additionalFields.map((field) => `_${toSnakeCase(field)}`))
    return suffixes
  },
  [nodeDefType.taxon]: () => ['', columnSuffixTaxonScientificName, columnSuffixTaxonVernacularName],
  [nodeDefType.file]: () => ['_file_uuid', '_file_name'],
}

const colTypesGetterByType = {
  [nodeDefType.boolean]: () => [SQL.types.varchar],
  [nodeDefType.code]: () => [SQL.types.varchar, SQL.types.varchar],
  [nodeDefType.coordinate]: ({ nodeDef }) => {
    const types = [SQL.types.geometryPoint, SQL.types.decimal, SQL.types.decimal, SQL.types.varchar]
    const additionalFields = NodeDef.getCoordinateAdditionalFields(nodeDef)
    types.push(...additionalFields.map(() => SQL.types.decimal)) // additional fields are all numeric
    return types
  },
  [nodeDefType.date]: () => [SQL.types.date],
  [nodeDefType.decimal]: () => [SQL.types.decimal],
  [nodeDefType.geo]: () => [SQL.types.varchar],
  [nodeDefType.entity]: () => [SQL.types.uuid],
  [nodeDefType.file]: () => [SQL.types.uuid, SQL.types.varchar],
  [nodeDefType.integer]: () => [SQL.types.bigint],
  [nodeDefType.taxon]: () => [SQL.types.varchar, SQL.types.varchar, SQL.types.varchar, SQL.types.varchar],
  [nodeDefType.text]: () => [SQL.types.varchar],
  [nodeDefType.time]: () => [SQL.types.time],
}

const getColumnNames = (nodeDef) => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const colsSuffixGetter = columnNamesSuffixGetterByType[NodeDef.getType(nodeDef)]
  const colsSuffix = colsSuffixGetter?.({ nodeDef })
  if (colsSuffix) {
    return colsSuffix.map((colSuffix) => `${nodeDefName}${colSuffix}`)
  }
  if (NodeDef.isEntity(nodeDef)) {
    return [`${nodeDefName}_uuid`]
  }
  return [nodeDefName]
}

const extractColumnName = ({ nodeDef, columnName }) => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const prefix = `${nodeDefName}_`
  // this is because when there is not subfix we should return
  if (NodeDef.isCode(nodeDef) && !new RegExp(prefix).test(columnName)) {
    return 'code'
  }
  return columnName.replace(prefix, '')
}

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
    this._types = colTypesGetterByType[NodeDef.getType(nodeDef)]({ nodeDef })
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
    return SQL.addAlias(this.table.alias, ...this.names)
  }

  get nameFull() {
    return this.namesFull[0]
  }

  get types() {
    return this._types
  }

  get codeLabelColumn() {
    if (!NodeDef.isCode(this.nodeDef)) return null
    return `${NodeDef.getName(this.nodeDef)}${columnSuffixCodeLabel}`
  }
}

ColumnNodeDef.columnSuffixCodeLabel = columnSuffixCodeLabel
ColumnNodeDef.columnSuffixTaxonScientificName = columnSuffixTaxonScientificName
ColumnNodeDef.columnSuffixTaxonVernacularName = columnSuffixTaxonVernacularName

ColumnNodeDef.getCodeLabelColumnName = (nodeDef) => `${NodeDef.getName(nodeDef)}${columnSuffixCodeLabel}`

ColumnNodeDef.getColumnNames = getColumnNames
ColumnNodeDef.getColumnName = R.pipe(ColumnNodeDef.getColumnNames, R.head)

ColumnNodeDef.getColumnNameAggregateFunction = ({ nodeDef, aggregateFn }) => {
  const columnName = ColumnNodeDef.getColumnName(nodeDef)
  if (Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS).includes(aggregateFn)) {
    return `${columnName}_${aggregateFn}`
  }
  // custom aggregate function: aggregateFn is the uuid of the custom aggregate function
  const customAggregateFunction = NodeDef.getAggregateFunctionByUuid(aggregateFn)(nodeDef)
  return `${columnName}_custom_agg_${customAggregateFunction?.name}`
}
ColumnNodeDef.extractColumnName = extractColumnName
