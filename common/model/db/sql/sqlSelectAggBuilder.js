import * as Survey from '../../../../core/survey/survey'
import * as NodeDef from '../../../../core/survey/nodeDef'
import * as StringUtils from '../../../../core/stringUtils'
import SystemError, { StatusCodes } from '../../../../core/systemError'
import { AggregateFunctionExpression } from '../../../../core/survey/aggregateFunctionExpression'
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
    const { survey } = this._viewDataNodeDef
    const nodeDefMeasure = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const columnMeasure = new ColumnNodeDef(this._viewDataNodeDef, nodeDefMeasure).name

    aggFunctions.forEach((aggFnNameOrUuid, aggFnIndex) => {
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
    })
    return this
  }

  /**
   * Converts the expression of a custom aggregate function into SQL: only the allowed SQL is used, never the stored text.
   * @param {object} aggregateFn - The custom aggregate function.
   * @returns {string} - The SQL of the expression.
   * @throws {SystemError} - When the expression is not valid (it may have been stored or imported without validation).
   */
  _customAggregateFunctionToSql(aggregateFn) {
    const { name, expression } = aggregateFn
    const columnNames = this._viewDataNodeDef.columnNodeDefNames
    if (AggregateFunctionExpression.validate({ expression, columnNames })) {
      throw new SystemError('appErrors:aggregateFunctionInvalid', { name }, StatusCodes.BAD_REQUEST)
    }
    return AggregateFunctionExpression.toSql({ expression, columnNames })
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
