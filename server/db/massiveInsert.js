import pgPromise from 'pg-promise'
import { db } from './db'
import { createColumnSet } from './dbUtils'

const pgp = pgPromise()

export default class MassiveInsert {
  /**
   * @class
   * @param {string} schema - The database schema name.
   * @param {string} table - The  database table name.
   * @param {object|pgp.helpers.Columns|Array} cols - The columns (see http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html).
   * @param {pgPromise.IDatabase} [client] - The database client.
   * @param {number} [bufferSize] - The size of the buffer.
   */
  constructor(schema, table, cols, client = db, bufferSize = 100000) {
    this.columnSet = createColumnSet({ pgp, columns: cols, schema, table })
    this.client = client
    this.values = []
    this.bufferSize = bufferSize
  }

  async push(...values) {
    this.values.push(...values)

    if (this.values.length === this.bufferSize) {
      await this.flush()
    }
  }

  async flush() {
    if (this.values.length > 0) {
      await this.client.none(pgp.helpers.insert(this.values, this.columnSet))
      this.values.length = 0
    }
  }
}
