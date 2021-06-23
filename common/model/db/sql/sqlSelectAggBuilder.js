import * as Survey from '../../../../core/survey/survey'
import * as NodeDef from '../../../../core/survey/nodeDef'
import { ColumnNodeDef } from '../tables/dataNodeDef'
import { Query } from '../../query'
import SqlSelectBuilder from './sqlSelectBuilder'

const sqlFunctionByAggregateFunction = {
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.avg]: 'AVG',
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.cnt]: 'COUNT',
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.max]: 'MAX',
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.med]: 'MEDIAN',
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.min]: 'MIN',
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.sum]: 'SUM',
}

class SqlSelectAggBuilder extends SqlSelectBuilder {
  constructor({ viewDataNodeDef }) {
    super()
    this._viewDataNodeDef = viewDataNodeDef
  }

  selectMeasure({ aggFunctions, nodeDefUuid, index }) {
    const paramName = `measure_field_${index}`
    const { survey } = this._viewDataNodeDef
    const nodeDefMeasure = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const columnMeasure = new ColumnNodeDef(this._viewDataNodeDef, nodeDefMeasure).name

    aggFunctions.forEach((aggFn) => {
      const fieldAggFn = sqlFunctionByAggregateFunction[aggFn]
      if (fieldAggFn) {
        // standard aggregate function
        const paramNameAlias = `${paramName}_${aggFn}_alias`
        const fieldAlias = `$/${paramNameAlias}:name/`
        this.select(`${fieldAggFn}($/${paramName}:name/) AS ${fieldAlias}`)
        this.addParams({ [paramNameAlias]: `${columnMeasure}_${aggFn}` })
      } else {
        // custom aggregate function
        const aggregateFn = NodeDef.getAggregateFunctionByUuid(aggFn)(nodeDefMeasure)
        const { name, expression } = aggregateFn
        if (name && expression) {
          const fieldAlias = `${paramName}_agg_${name}`
          this.select(`( ${expression} ) AS ${fieldAlias}`)
        }
      }
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
