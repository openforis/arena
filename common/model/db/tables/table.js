import * as SQL from '../sql'
/**
 * A database table object.
 *
 * @typedef {object} module:arena.Table
 * @property {string} schema - The schema it belongs to.
 * @property {string} name - The table name.
 * @property {string} alias - The table alias.
 * @property {string[]} columns - The table columns with alias.
 */
export default class Table {
  /**
   * Create an instance of a Table.
   *
   * @param {!string} schema - The schema.
   * @param {!string} name - The table name.
   * @param {object.<string, string>} [columnSet={}] -  - The table column set.
   */
  constructor(schema, name, columnSet = {}) {
    if (new.target === Table) {
      throw new TypeError('Cannot construct Table instance directly')
    }

    this._schema = schema
    this._name = name
    this._alias = SQL.createAlias(name)
    this._columns = SQL.addAlias(this.alias, ...Object.values(columnSet))
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

  get nameFull() {
    return `${this.schema}.${this.name} AS ${this.alias}`
  }

  get alias() {
    return this._alias
  }

  set alias(alias) {
    this._alias = alias
  }

  get columns() {
    return this._columns
  }

  getColumn(columnName) {
    return SQL.addAlias(this.alias, columnName)[0]
  }
}
