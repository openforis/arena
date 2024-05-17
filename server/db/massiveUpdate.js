import pgPromise from 'pg-promise'
import { db } from '@server/db/db'

const pgp = pgPromise()

export default class MassiveUpdate {
  /**
   * @class
   *
   * @param {string} schema - The database schema name.
   * @param {string} table - The  database table name.
   * @param {object|pgp.helpers.Columns|Array} cols - The columns (see http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html).
   * @param {pgPromise.IDatabase} [client=db] - The database client.
   * @param {number} [bufferSize=100000] - The size of the buffer.
   */
  constructor({ schema, table, cols, where = null }, client = db, bufferSize = 100000) {
    this.columnSet = new pgp.helpers.ColumnSet(cols, { table: { schema, table } })
    this.client = client
    this.where = where
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
      const query = pgp.helpers.update(this.values, this.columnSet) + (this.where ? this.where : '')
      await this.client.none(query)
      this.values.length = 0
    }
  }
}
