import SqlSelectBuilder from '@common/model/db/sql/sqlSelectBuilder'

class SqlSelectAggBuilder extends SqlSelectBuilder {
  constructor() {
    super()
  }

  build() {
    return `SELECT ${this._select.join(', ')}
      ${this._from.join(' ')}
      ${this._where.join(' ')}
      ${this._limit.join(' ')}
      ${this._offset.join(' ')}
    `
  }
}

export default SqlSelectAggBuilder
