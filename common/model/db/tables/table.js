import * as SQL from '../sql'
/**
 * A database table object.
 *
 * @typedef {object} module:arena.Table
 * @property {string} name - The table name.
 * @property {string} alias - The table alias.
 * @property {string[]} columns - The table columns with alias.
 */
export default class Table {
  /**
   * Create an instance of a Table.
   *
   * @param {string} name - The table name.
   * @param {object.<string, string>} columnSet -  - The table column set.
   */
  constructor(name, columnSet) {
    if (new.target === Table) {
      throw new TypeError('Cannot construct Table instance directly')
    }

    this._name = name
    this._alias = SQL.createAlias(name)
    this._columns = SQL.addAlias(this.alias, ...Object.values(columnSet))
  }

  get name() {
    return this._name
  }

  get alias() {
    return this._alias
  }

  get columns() {
    return this._columns
  }

  getColumn(columnName) {
    return SQL.addAlias(this.alias, columnName)[0]
  }

  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  getSchema(surveyId) {
    throw new TypeError('Cannot call abstract method Table.getSchema')
  }
}
