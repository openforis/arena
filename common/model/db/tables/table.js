import * as SQL from '../sql'

// common column set
const columnSetCommon = {
  dateCreated: 'date_created',
  dateModified: 'date_modified',
  id: 'id',
  iId: 'i_id',
  props: 'props',
  propsDraft: 'props_draft',
  uuid: 'uuid',
}

/**
 * A database table object.
 * @typedef {object} module:arena.Table
 * @property {string} schema - The schema it belongs to.
 * @property {string} name - The table name.
 * @property {string} alias - The table alias.
 * @property {string[]} columns - The table columns with alias.
 */
export default class Table {
  /**
   * Create an instance of a Table.
   * @param {!string} schema - The schema.
   * @param {!string} name - The table name.
   * @param {{[key: string]: string}} [columnSet] - The table column set.
   */
  constructor(schema, name, columnSet = {}) {
    if (new.target === Table) {
      throw new TypeError('Cannot construct Table instance directly')
    }

    this._schema = schema
    this._columnSet = columnSet
    this.name = name
  }

  get schema() {
    return this._schema
  }

  set schema(schema) {
    this._schema = schema
  }

  get name() {
    return this._name
  }

  set name(name) {
    this._name = name
    this._alias = SQL.createAlias(name)
  }

  get alias() {
    return this._alias
  }

  set alias(alias) {
    this._alias = alias
  }

  get nameQualified() {
    return `${this.schema}."${this.name}"`
  }

  get nameAliased() {
    return `${this.nameQualified} AS ${this.alias}`
  }

  get columns() {
    return SQL.addAlias(this.alias, ...Object.values(this._columnSet))
  }

  getColumn(columnName) {
    return SQL.addAlias(this.alias, columnName)[0]
  }

  // ======= common columns
  _getColumnCommon(column) {
    if (Object.values(this._columnSet).indexOf(column) < 0) {
      throw new TypeError(`Column ${column} does not exist`)
    }
    return this.getColumn(column)
  }

  get columnDateCreated() {
    return this._getColumnCommon(columnSetCommon.dateCreated)
  }

  get columnDateModified() {
    return this._getColumnCommon(columnSetCommon.dateModified)
  }

  get columnId() {
    return this._getColumnCommon(columnSetCommon.id)
  }

  get columnUuid() {
    return this._getColumnCommon(columnSetCommon.uuid)
  }

  get columnProps() {
    return this._getColumnCommon(columnSetCommon.props)
  }

  get columnPropsDraft() {
    return this._getColumnCommon(columnSetCommon.propsDraft)
  }
}

Table.columnSetCommon = columnSetCommon
