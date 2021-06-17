import { ColumnNodeDef } from '@common/model/db'
import { Query } from '@common/model/query'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

export const useColumn = ({ colWidth, query, nodeDef }) => {
  const modeEdit = Query.isModeRawEdit(query)

  const aggregateFunctions = Query.isModeAggregate(query)
    ? Query.getMeasures(query).get(NodeDef.getUuid(nodeDef))
    : null
  const isMeasure = Boolean(aggregateFunctions)
  const colNames = isMeasure
    ? // for every measure add a column for each aggregate function
      aggregateFunctions.map((aggregateFn) => `${ColumnNodeDef.getColName(nodeDef)}_${aggregateFn}`)
    : ColumnNodeDef.getColNames(nodeDef)

  // TODO check where and how it's used
  const customAggregateFunction =
    isMeasure && !Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS).includes(aggregateFunctions[0])
      ? aggregateFunctions[0].clause
      : null

  const customAggregateFunctionUuids = isMeasure
    ? aggregateFunctions.filter((fn) => !Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS).includes(fn))
    : []

  const noCols = modeEdit ? NodeDefUIProps.getFormFields(nodeDef).length : colNames.length

  const widthOuter = colWidth * noCols
  const widthInner = `${(1 / noCols) * 100}%`

  return {
    modeEdit,
    colNames,
    isMeasure,
    aggregateFunctions,
    customAggregateFunction,
    customAggregateFunctionUuids,
    noCols,
    widthInner,
    widthOuter,
  }
}
