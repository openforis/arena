import pgPromise from 'pg-promise'

import { db, DbClient } from './db'
import { ColumnSetColumn, createColumnSet } from './dbUtils'

const pgp = pgPromise()

// inserts the values in bulk (with pgp.helpers.insert), every bufferSize values
export default class MassiveInsert {
  readonly columnSet: pgPromise.ColumnSet
  readonly client: DbClient
  readonly values: Record<string, unknown>[]
  readonly bufferSize: number

  // cols: see http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html
  constructor(schema: string, table: string, cols: ColumnSetColumn[], client: DbClient = db, bufferSize = 100000) {
    this.columnSet = createColumnSet({ pgp, columns: cols, schema, table })
    this.client = client
    this.values = []
    this.bufferSize = bufferSize
  }

  async push(...values: Record<string, unknown>[]): Promise<void> {
    this.values.push(...values)

    if (this.values.length === this.bufferSize) {
      await this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.values.length > 0) {
      await this.client.none(pgp.helpers.insert(this.values, this.columnSet))
      this.values.length = 0
    }
  }
}
