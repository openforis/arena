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
  const columnNames = isMeasure
    ? // for every measure add a column for each aggregate function
      aggregateFunctions.map((aggregateFn) => `${ColumnNodeDef.getColumnName(nodeDef)}_${aggregateFn}`)
    : ColumnNodeDef.getColumnNames(nodeDef)

  const customAggregateFunctionUuids = isMeasure
    ? aggregateFunctions.filter((fn) => !Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS).includes(fn))
    : []

  const noCols = modeEdit ? NodeDefUIProps.getFormFields(nodeDef).length : columnNames.length

  const widthOuter = colWidth * noCols
  const widthInner = `${(1 / noCols) * 100}%`

  return {
    modeEdit,
    columnNames,
    isMeasure,
    aggregateFunctions,
    customAggregateFunctionUuids,
    noCols,
    widthInner,
    widthOuter,
  }
}
