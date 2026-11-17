import * as A from '@core/arena'
import SqlBuilder from '@common/model/db/sql/sqlBuilder'

class SqlSelectBuilder extends SqlBuilder {
  protected _select: string[]
  protected _from: string[]
  protected _where: string[]
  protected _groupBy: string[]
  // number or query param placeholder (e.g. $/offset/)
  protected _offset: number | string | null
  protected _limit: number | string | null
  protected _orderBy: string[]

  constructor() {
    super()
    this._select = []
    this._from = []
    this._where = []
    this._groupBy = []
    this._offset = null
    this._limit = null
    this._orderBy = []
  }

  get selectFields(): string[] {
    return this._select
  }

  select(...fields: string[]): this {
    this._select.push(...fields)
    return this
  }

  from(...fromTables: string[]): this {
    this._from.push(...fromTables)
    return this
  }

  where(...conditions: string[]): this {
    this._where.push(...conditions)
    return this
  }

  groupBy(...fields: string[]): this {
    this._groupBy.push(...fields)
    return this
  }

  offset(offset: number | string | null): this {
    this._offset = offset
    return this
  }

  limit(limit: number | string | null): this {
    this._limit = limit
    return this
  }

  orderBy(...fields: string[]): this {
    this._orderBy.push(...fields)
    return this
  }

  build(): string {
    const parts = [`SELECT ${this._select.join(', ')}`, `FROM ${this._from.join(' ')}`]

    if (!A.isEmpty(this._where)) {
      parts.push(`WHERE ${this._where.join(' AND ')}`)
    }
    if (!A.isEmpty(this._groupBy)) {
      parts.push(`GROUP BY ${this._groupBy.join(', ')}`)
    }
    if (!A.isEmpty(this._orderBy)) {
      parts.push(`ORDER BY ${this._orderBy.join(', ')}`)
    }
    if (this._offset) {
      parts.push(`OFFSET ${this._offset}`)
    }
    if (this._limit) {
      parts.push(`LIMIT ${this._limit}`)
    }
    return parts.join(' ')
  }
}

export default SqlSelectBuilder
