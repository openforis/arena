/**
 * Class representing a database table.
 */
export default class Table {
  /**
   * Create a database table.
   *
   * @param {!string} name - The table name.
   * @param {!object.<string, string>} columnSet - The columns set configuration.
   */
  constructor(name, columnSet) {
    this._name = name
    this._columnSet = columnSet
    this._columns = Object.values(columnSet)
    this._alias = name
      .split('_')
      .map((word) => word[0])
      .join('')
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

  get columnSet() {
    return this._columnSet
  }

  addAlias(arg) {
    return `${this.alias}.${arg}`
  }

  jsonBuildObject(columns) {
    return `json_build_object(${columns.map((col) => `'${col}', ${this.addAlias(col)}`).join(', ')})`
  }

  jsonAgg(expression, orderByColumn = null) {
    return `json_agg(${expression}${orderByColumn ? ` ORDER BY ${this.addAlias(orderByColumn)}` : ''})`
  }
}
