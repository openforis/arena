import * as Survey from '@core/survey/survey'

import SqlSelectBuilder from './sqlSelectBuilder'

class SqlSelectOlapBuilder extends SqlSelectBuilder {
  constructor({ table, entityDef }) {
    super()
    this._table = table
    this._entityDef = entityDef
  }

  _selectNodeDef({ nodeDefUuid }) {
    const { _table: table } = this
    const { survey } = table
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const columnName = table.getColumnNameByAttributeDef(nodeDef)
    this.select(columnName)
    return this
  }

  selectMeasure({ nodeDefUuid }) {
    const { _table: table } = this
    const { survey } = table
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const columnName = table.getColumnNameByAttributeDef(nodeDef)
    this.select(`SUM(${columnName} AS ${columnName}`)
    this.select(`SUM(${columnName})/${SqlSelectOlapBuilder.areaAlias} AS ${columnName}_ha`)
    this.groupBy(columnName)
    return this
  }

  selectDimension({ nodeDefUuid }) {
    return this._selectNodeDef({ nodeDefUuid })
  }
}

SqlSelectOlapBuilder.areaAlias = 'area'

export default SqlSelectOlapBuilder
