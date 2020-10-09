import * as Survey from '../../../../core/survey/survey'
import { ColumnNodeDef } from '..'
import { Query } from '../../query'
import SqlSelectBuilder from './sqlSelectBuilder'

const sqlFunctionByAggregateFunction = {
  [Query.aggregateFunctions.avg]: 'AVG',
  [Query.aggregateFunctions.cnt]: 'COUNT',
  [Query.aggregateFunctions.max]: 'MAX',
  [Query.aggregateFunctions.med]: 'MEDIAN',
  [Query.aggregateFunctions.min]: 'MIN',
  [Query.aggregateFunctions.sum]: 'SUM',
}

class SqlSelectAggBuilder extends SqlSelectBuilder {
  constructor({ viewDataNodeDef }) {
    super()
    this._viewDataNodeDef = viewDataNodeDef
  }

  selectMeasure({ aggFunctions, nodeDefUuid, index }) {
    const paramName = `measure_field_${index}`
    const nodeDefMeasure = Survey.getNodeDefByUuid(nodeDefUuid)(this._viewDataNodeDef.survey)
    const columnMeasure = new ColumnNodeDef(this._viewDataNodeDef, nodeDefMeasure).name

    aggFunctions.forEach((aggFn) => {
      const paramNameAlias = `${paramName}_${aggFn}_alias`
      const fieldAlias = `$/${paramNameAlias}:name/`
      const field = `${sqlFunctionByAggregateFunction[aggFn]}($/${paramName}:name/) AS ${fieldAlias}`
      this.select(field)
      const measureAlias = `${columnMeasure}_${aggFn}`
      this.addParams({ [paramNameAlias]: measureAlias })
    })
    this.addParams({ [paramName]: columnMeasure })
    return this
  }

  selectDimension({ dimension, index }) {
    const paramName = `dimension_field_${index}`
    const selectField = `$/${paramName}:name/`
    this.select(selectField)
    this.groupBy(selectField)
    const nodeDefDimension = Survey.getNodeDefByUuid(dimension)(this._viewDataNodeDef.survey)
    const columnDimension = new ColumnNodeDef(this._viewDataNodeDef, nodeDefDimension).name
    this.addParams({ [paramName]: columnDimension })
    return this
  }
}

export default SqlSelectAggBuilder
