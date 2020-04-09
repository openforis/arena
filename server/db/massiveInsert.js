import pgPromise from 'pg-promise'
import { db } from '@server/db/db'

const pgp = pgPromise()

export default class MassiveInsert {
  /**
   * @constructor
   *
   * @param {string} schema - database schema name
   * @param {string} table - database table name
   * @param {object|pgp.helpers.Columns|Array} cols - The columns (see http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html)
   * @param {Object} [client = db] - The database client
   * @param {number} [bufferSize = 100000] - The size of the buffer
   */
  constructor(schema, table, cols, client = db, bufferSize = 100000) {
    this.columnSet = new pgp.helpers.ColumnSet(cols, { table: { schema, table } })
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
