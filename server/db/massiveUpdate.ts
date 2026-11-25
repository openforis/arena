import pgPromise from 'pg-promise'

import { db, DbClient } from '@server/db/db'

import { ColumnSetColumn, createColumnSet } from './dbUtils'

const pgp = pgPromise()

// updates the values in bulk (with pgp.helpers.update), every bufferSize values
export default class MassiveUpdate {
  readonly columnSet: pgPromise.ColumnSet
  readonly client: DbClient
  readonly where: string | null
  readonly values: Record<string, unknown>[]
  readonly bufferSize: number

  // cols: see http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html
  constructor(
    {
      schema,
      table,
      cols,
      where = null,
    }: { schema: string; table: string; cols: ColumnSetColumn[]; where?: string | null },
    client: DbClient = db,
    bufferSize = 100000
  ) {
    this.columnSet = createColumnSet({ pgp, columns: cols, schema, table })
    this.client = client
    this.where = where
    this.values = []
    this.bufferSize = bufferSize
  }

  async push(...values: Record<string, unknown>[]): Promise<void> {
    this.values.push(...values)

    // values can be pushed in batches, so the buffer size can be exceeded
    if (this.values.length >= this.bufferSize) {
      await this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.values.length > 0) {
      const query = pgp.helpers.update(this.values, this.columnSet) + (this.where ? this.where : '')
      await this.client.none(query)
      this.values.length = 0
    }
  }
}
