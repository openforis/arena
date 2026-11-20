import * as StringUtils from '@core/stringUtils'

import * as SQL from '../sql'

// common column set
const columnSetCommon = {
  dateCreated: 'date_created',
  dateModified: 'date_modified',
  id: 'id',
  props: 'props',
  propsDraft: 'props_draft',
  uuid: 'uuid',
}

export type ColumnSet = Record<string, string>

// a database table (abstract), with schema, name, alias and columns (with alias)
export default class Table {
  static readonly columnSetCommon = columnSetCommon

  protected _schema: string
  protected _columnSet: ColumnSet
  private _name: string
  private _alias: string

  constructor(schema: string, name: string, columnSet: ColumnSet = {}) {
    if (new.target === Table) {
      throw new TypeError('Cannot construct Table instance directly')
    }

    this._schema = schema
    this._columnSet = columnSet
    this.name = name
  }

  get schema(): string {
    return this._schema
  }

  set schema(schema: string) {
    this._schema = schema
  }

  get name(): string {
    return this._name
  }

  set name(name: string) {
    this._name = name
    this._alias = SQL.createAlias(name)
  }

  get alias(): string {
    return this._alias
  }

  set alias(alias: string) {
    this._alias = alias
  }

  get nameQualified(): string {
    return `${this.schema}.${StringUtils.quoteDouble(this.name)}` // name should be quoted: it can contain reserved words
  }

  get nameAliased(): string {
    return `${this.nameQualified} AS ${this.alias}`
  }

  get columns(): string[] {
    return SQL.addAlias(this.alias, ...Object.values(this._columnSet))
  }

  getColumn(columnName: string): string {
    return SQL.addAlias(this.alias, columnName)[0]
  }

  // ======= common columns
  _getColumnCommon(column: string): string {
    if (!Object.values(this._columnSet).includes(column)) {
      throw new TypeError(`Column ${column} does not exist`)
    }
    return this.getColumn(column)
  }

  get columnDateCreated(): string {
    return this._getColumnCommon(columnSetCommon.dateCreated)
  }

  get columnDateModified(): string {
    return this._getColumnCommon(columnSetCommon.dateModified)
  }

  get columnId(): string {
    return this._getColumnCommon(columnSetCommon.id)
  }

  get columnUuid(): string {
    return this._getColumnCommon(columnSetCommon.uuid)
  }

  get columnProps(): string {
    return this._getColumnCommon(columnSetCommon.props)
  }

  get columnPropsDraft(): string {
    return this._getColumnCommon(columnSetCommon.propsDraft)
  }
}
