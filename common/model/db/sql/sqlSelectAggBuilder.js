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

  selectMeasure({ aggFunctions, nodeDefUuid }) {
    const { survey } = this._viewDataNodeDef
    const nodeDefMeasure = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const columnMeasure = new ColumnNodeDef(this._viewDataNodeDef, nodeDefMeasure).name

    aggFunctions.forEach((aggFnNameOrUuid) => {
      const fieldAggFn = sqlFunctionByAggregateFunction[aggFnNameOrUuid]

      const fieldAlias = ColumnNodeDef.getColumnNameAggregateFunction({
        nodeDef: nodeDefMeasure,
        aggregateFn: aggFnNameOrUuid,
      })
      if (fieldAggFn) {
        // standard aggregate function
        this.select(`${fieldAggFn}(${columnMeasure}) AS ${fieldAlias}`)
      } else {
        // custom aggregate function
        const aggregateFnUuid = aggFnNameOrUuid
        const aggregateFn = NodeDef.getAggregateFunctionByUuid(aggregateFnUuid)(nodeDefMeasure)
        if (aggregateFn) {
          const { name, expression } = aggregateFn
          if (name && expression) {
            this.select(`( ${expression} ) AS ${fieldAlias}`)
          }
        }
      }
    })
    return this
  }

  selectDimension({ dimension, index }) {
    const nodeDefDimension = Survey.getNodeDefByUuid(dimension)(this._viewDataNodeDef.survey)
    const columnDimension = new ColumnNodeDef(this._viewDataNodeDef, nodeDefDimension)
    columnDimension.names.forEach((columnName, columnIndex) => {
      const paramName = `dimension_field_${index}_${columnIndex}`
      const selectFields = [`$/${paramName}:name/`]
      this.select(...selectFields)
      this.groupBy(...selectFields)
      this.addParams({ [paramName]: columnName })
    })
    return this
  }
}

export default SqlSelectAggBuilder
