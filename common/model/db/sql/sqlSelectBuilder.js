import * as A from '@core/arena'
import SqlBuilder from '@common/model/db/sql/sqlBuilder'

class SqlSelectBuilder extends SqlBuilder {
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

  select(...fields) {
    this._select.push(...fields)
    return this
  }

  from(...fromTables) {
    this._from.push(...fromTables)
    return this
  }

  where(...conditions) {
    this._where.push(...conditions)
    return this
  }

  groupBy(...fields) {
    this._groupBy.push(...fields)
    return this
  }

  offset(offset) {
    this._offset = offset
    return this
  }

  limit(limit) {
    this._limit = limit
    return this
  }

  orderBy(...fields) {
    this._orderBy.push(...fields)
    return this
  }

  build() {
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
