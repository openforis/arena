import * as StringUtils from '../../../../core/stringUtils'
import { AggregateFunctionExpression } from '../../../../core/survey/aggregateFunctionExpression'
import * as NodeDef from '../../../../core/survey/nodeDef'
import * as Survey from '../../../../core/survey/survey'
import SystemError, { StatusCodes } from '../../../../core/systemError'
import { Query } from '../../query'
import { ColumnNodeDef } from '../tables/dataNodeDef'
import type ViewDataNodeDef from '../views/dataNodeDef/view'

import SqlSelectBuilder from './sqlSelectBuilder'

const sqlFunctionByAggregateFunction: Record<string, string> = {
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.avg]: 'AVG',
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.cnt]: 'COUNT',
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.max]: 'MAX',
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.med]: 'MEDIAN',
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.min]: 'MIN',
  [Query.DEFAULT_AGGREGATE_FUNCTIONS.sum]: 'SUM',
}

class SqlSelectAggBuilder extends SqlSelectBuilder {
  private readonly _viewDataNodeDef: ViewDataNodeDef

  constructor({ viewDataNodeDef }: { viewDataNodeDef: ViewDataNodeDef }) {
    super()
    this._viewDataNodeDef = viewDataNodeDef
  }

  selectMeasure({
    aggFunctions,
    nodeDefUuid,
    index,
  }: {
    aggFunctions: string[]
    nodeDefUuid: string
    index: number
  }): this {
    const { survey } = this._viewDataNodeDef
    const nodeDefMeasure = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const columnMeasure = new ColumnNodeDef(this._viewDataNodeDef, nodeDefMeasure).name

    for (const [aggFnIndex, aggFnNameOrUuid] of aggFunctions.entries()) {
      const fieldAggFn = sqlFunctionByAggregateFunction[aggFnNameOrUuid]

      const fieldAlias = ColumnNodeDef.getColumnNameAggregateFunction({
        nodeDef: nodeDefMeasure,
        aggregateFn: aggFnNameOrUuid,
      })
      if (fieldAggFn) {
        // standard aggregate function
        this.select(`${fieldAggFn}(${StringUtils.quoteDouble(columnMeasure)}) AS ${fieldAlias}`)
      } else {
        // custom aggregate function
        const aggregateFnUuid = aggFnNameOrUuid
        const aggregateFn = NodeDef.getAggregateFunctionByUuid(aggregateFnUuid)(nodeDefMeasure)
        if (aggregateFn?.name && aggregateFn.expression) {
          const paramName = `custom_agg_fn_${index}_${aggFnIndex}`
          this.select(`( ${this._customAggregateFunctionToSql(aggregateFn)} ) AS $/${paramName}:name/`)
          this.addParams({ [paramName]: fieldAlias })
        }
      }
    }
    return this
  }

  // converts a custom aggregate function expression into SQL (only the allowed SQL, never the stored text);
  // throws a SystemError if the expression is not valid (it may have been stored or imported without validation)
  _customAggregateFunctionToSql(aggregateFn: { name: string; expression: string }): string {
    const { name, expression } = aggregateFn
    const columnNames = this._viewDataNodeDef.columnNodeDefNames
    if (AggregateFunctionExpression.validate({ expression, columnNames })) {
      throw new SystemError('appErrors:aggregateFunctionInvalid', { name }, StatusCodes.BAD_REQUEST)
    }
    return AggregateFunctionExpression.toSql({ expression, columnNames })
  }

  selectDimension({ dimension, index }: { dimension: string; index: number }): this {
    const nodeDefDimension = Survey.getNodeDefByUuid(dimension)(this._viewDataNodeDef.survey)
    const columnDimension = new ColumnNodeDef(this._viewDataNodeDef, nodeDefDimension)
    for (const [columnIndex, columnName] of columnDimension.names.entries()) {
      const paramName = `dimension_field_${index}_${columnIndex}`
      const selectFields = [`$/${paramName}:name/`]
      this.select(...selectFields)
      this.groupBy(...selectFields)
      this.addParams({ [paramName]: columnName })
    }
    return this
  }
}

export default SqlSelectAggBuilder
