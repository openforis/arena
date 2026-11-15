import toSnakeCase from 'to-snake-case'

import { NodeDefs, NodeValues } from '@openforis/arena-core'
import type { NodeDef as ArenaNodeDef, NodeDefCoordinate, NodeDefType } from '@openforis/arena-core'

import * as NodeDef from '../../../../../core/survey/nodeDef'
import { Query } from '../../../query'

import * as SQL from '../../sql'

const { nodeDefType } = NodeDef

type AnyNodeDef = ArenaNodeDef<NodeDefType>
type ByNodeDefGetter = (params: { nodeDef: AnyNodeDef }) => string[]
// table or view the column belongs to
type ColumnTable = { alias: string }

const columnSuffixCodeLabel = '_label'
const columnSuffixFileUuid = '_file_uuid'
const columnSuffixFileName = '_file_name'
const columnSuffixTaxonScientificName = '_scientific_name'
const columnSuffixTaxonVernacularName = '_vernacular_name'

const columnNamesSuffixGetterByType: Partial<Record<string, ByNodeDefGetter>> = {
  [nodeDefType.code]: () => ['', columnSuffixCodeLabel],
  [nodeDefType.coordinate]: ({ nodeDef }) => {
    const suffixes = ['', '_x', '_y', '_srs']
    const additionalFields = NodeDef.getCoordinateAdditionalFields(nodeDef as NodeDefCoordinate)
    suffixes.push(...additionalFields.map((field) => `_${toSnakeCase(field)}`))
    return suffixes
  },
  [nodeDefType.taxon]: ({ nodeDef }) => {
    const colNames = ['', columnSuffixTaxonScientificName]
    if (NodeDefs.isFieldVisible(NodeValues.ValuePropsTaxon.vernacularName)(nodeDef)) {
      colNames.push(columnSuffixTaxonVernacularName)
    }
    return colNames
  },
  [nodeDefType.file]: () => [columnSuffixFileUuid, columnSuffixFileName],
}

const colTypesGetterByType: Partial<Record<string, ByNodeDefGetter>> = {
  [nodeDefType.boolean]: () => [SQL.types.varchar],
  [nodeDefType.code]: () => [SQL.types.varchar, SQL.types.varchar],
  [nodeDefType.coordinate]: ({ nodeDef }) => {
    const types: string[] = [SQL.types.geometryPoint, SQL.types.decimal, SQL.types.decimal, SQL.types.varchar]
    const additionalFields = NodeDef.getCoordinateAdditionalFields(nodeDef as NodeDefCoordinate)
    types.push(...additionalFields.map(() => SQL.types.decimal)) // additional fields are all numeric
    return types
  },
  [nodeDefType.date]: () => [SQL.types.date],
  [nodeDefType.decimal]: () => [SQL.types.decimal],
  [nodeDefType.geo]: () => [SQL.types.varchar],
  [nodeDefType.entity]: () => [SQL.types.uuid],
  [nodeDefType.file]: () => [SQL.types.uuid, SQL.types.varchar],
  [nodeDefType.integer]: () => [SQL.types.bigint],
  [nodeDefType.taxon]: ({ nodeDef }) => {
    const colTypes = [SQL.types.varchar, SQL.types.varchar]
    if (NodeDefs.isFieldVisible(NodeValues.ValuePropsTaxon.vernacularName)(nodeDef)) {
      colTypes.push(SQL.types.varchar)
    }
    return colTypes
  },

  [nodeDefType.text]: () => [SQL.types.varchar],
  [nodeDefType.time]: () => [SQL.types.time],
}

const getColumnNames = (nodeDef: AnyNodeDef): string[] => {
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

const extractColumnName = ({ nodeDef, columnName }: { nodeDef: AnyNodeDef; columnName: string }): string => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const prefix = `${nodeDefName}_`
  // this is because when there is not subfix we should return
  if (NodeDef.isCode(nodeDef) && !new RegExp(prefix).test(columnName)) {
    return 'code'
  }
  return columnName.replace(prefix, '')
}

const getColumnNameWithSuffix = (suffix: string) => (nodeDef: AnyNodeDef) => `${NodeDef.getName(nodeDef)}${suffix}`

const getColumnName = (nodeDef: AnyNodeDef): string => getColumnNames(nodeDef)[0]

const getColumnNameAggregateFunction = ({ nodeDef, aggregateFn }: { nodeDef: AnyNodeDef; aggregateFn: string }) => {
  const columnName = getColumnName(nodeDef)
  if (Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS).includes(aggregateFn)) {
    return `${columnName}_${aggregateFn}`
  }
  // custom aggregate function: aggregateFn is the uuid of the custom aggregate function
  const customAggregateFunction = NodeDef.getAggregateFunctionByUuid(aggregateFn)(nodeDef)
  return `${columnName}_custom_agg_${customAggregateFunction?.name}`
}

// a column of a node def data table or view
export default class ColumnNodeDef {
  static readonly columnSuffixCodeLabel = columnSuffixCodeLabel
  static readonly columnSuffixFileUuid = columnSuffixFileUuid
  static readonly columnSuffixFileName = columnSuffixFileName
  static readonly columnSuffixTaxonScientificName = columnSuffixTaxonScientificName
  static readonly columnSuffixTaxonVernacularName = columnSuffixTaxonVernacularName

  static readonly getCodeLabelColumnName = getColumnNameWithSuffix(columnSuffixCodeLabel)
  static readonly getFileNameColumnName = getColumnNameWithSuffix(columnSuffixFileName)
  static readonly getFileUuidColumnName = getColumnNameWithSuffix(columnSuffixFileUuid)

  static readonly getColumnNames = getColumnNames
  static readonly getColumnName = getColumnName
  static readonly getColumnNameAggregateFunction = getColumnNameAggregateFunction
  static readonly extractColumnName = extractColumnName

  private readonly _table: ColumnTable
  private readonly _nodeDef: AnyNodeDef
  private readonly _names: string[]
  private readonly _types: string[]

  constructor(table: ColumnTable, nodeDef: AnyNodeDef) {
    this._table = table
    this._nodeDef = nodeDef
    this._names = getColumnNames(nodeDef)
    this._types = colTypesGetterByType[NodeDef.getType(nodeDef)]({ nodeDef })
  }

  get table(): ColumnTable {
    return this._table
  }

  get nodeDef(): AnyNodeDef {
    return this._nodeDef
  }

  get names(): string[] {
    return this._names
  }

  get name(): string {
    return this.names[0]
  }

  get namesFull(): string[] {
    return SQL.addAlias(this.table.alias, ...this.names)
  }

  get nameFull(): string {
    return this.namesFull[0]
  }

  get types(): string[] {
    return this._types
  }

  get jsTypes(): string[] {
    return this.types.map((type) => SQL.getJsTypeBySqlType(type))
  }

  get codeLabelColumn(): string | null {
    return NodeDef.isCode(this.nodeDef) ? `${NodeDef.getName(this.nodeDef)}${columnSuffixCodeLabel}` : null
  }

  get fileNameColumn(): string | null {
    return NodeDef.isFile(this.nodeDef) ? `${NodeDef.getName(this.nodeDef)}${columnSuffixFileName}` : null
  }
}
