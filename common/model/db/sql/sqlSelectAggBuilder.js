import * as Survey from '../../../../core/survey/survey'
import * as NodeDef from '../../../../core/survey/nodeDef'
import * as Expression from '../../../../core/expressionParser/expression'
import ViewDataNodeDef from '../views/dataNodeDef'
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

/**
 * Get the custom aggregate measure with a sub-select from the view associated to the node def related to the measure.
 *
 * @param {!object} params - The parameters object.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!NodeDef} [params.nodeDefMeasure] - The node definition associated to the measure.
 * @param {!string} [params.aggFnClause] - The custom aggregate function query part.
 * @param {!Expression} [params.filter] - The query filter expression.
 *
 * @returns {string} - The sub-select query string (with named parameters).
 */
const getCustomAggregateMeasureField = (params) => {
  const { survey, cycle, nodeDefMeasure, aggFnClause, filter } = params
  const entityDefPrevStep = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nodeDefMeasure))(survey)
  const viewDataNodeDefPrevStep = new ViewDataNodeDef(survey, entityDefPrevStep)
  const subselectBuilder = new SqlSelectBuilder()
    .select(`${aggFnClause}`)
    .from(viewDataNodeDefPrevStep.nameQualified)
    .where(`${ViewDataNodeDef.columnSet.recordCycle} = $/cycle/`)
    .addParams({ cycle })

  const { clause: filterClause } = filter ? Expression.toSql(filter) : {}
  if (filterClause) {
    subselectBuilder.where(` AND ${filterClause}`)
  }
  return subselectBuilder.build()
}

class SqlSelectAggBuilder extends SqlSelectBuilder {
  constructor({ viewDataNodeDef }) {
    super()
    this._viewDataNodeDef = viewDataNodeDef
  }

  selectMeasure({ aggFunctions, nodeDefUuid, index, cycle, filter }) {
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
        const { clause: aggFnClause, params: aggFnParams } = aggFn
        const paramNameAlias = `${paramName}_agg_alias`
        const fieldAlias = `$/${paramNameAlias}:name/`
        const field = getCustomAggregateMeasureField({ survey, cycle, nodeDefMeasure, aggFnClause, filter })
        this.select(`( ${field} ) AS ${fieldAlias}`)
        this.addParams({ ...aggFnParams, [paramNameAlias]: `${columnMeasure}_agg` })
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
