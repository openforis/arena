import * as Survey from '@core/survey/survey'

import SqlSelectBuilder from './sqlSelectBuilder'

class SqlSelectOlapBuilder extends SqlSelectBuilder {
  constructor({ table }) {
    super()
    this._table = table
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
    const columnNameToDecimal = `CAST(${columnName} AS DECIMAL)`
    this.select(`SUM(${columnNameToDecimal}) AS ${columnName}`)
    this.select(`SUM(${columnNameToDecimal})/${SqlSelectOlapBuilder.areaAlias} AS ${columnName}_ha`)
    this.groupBy(columnName)
    return this
  }

  selectDimension({ nodeDefUuid }) {
    return this._selectNodeDef({ nodeDefUuid })
  }
}

SqlSelectOlapBuilder.areaAlias = 'area'

export default SqlSelectOlapBuilder
