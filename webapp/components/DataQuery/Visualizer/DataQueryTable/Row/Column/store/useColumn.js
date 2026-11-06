import { ColumnNodeDef } from '@common/model/db'
import { Query } from '@common/model/query'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

export const useColumn = ({ codesVisible, colWidth, query, nodeDef, percentageVisible = false }) => {
  const modeEdit = Query.isModeRawEdit(query)
  const modeAggregate = Query.isModeAggregate(query)

  const aggregateFunctions = modeAggregate ? Query.getMeasureAggregateFunctions(NodeDef.getUuid(nodeDef))(query) : null
  const isMeasure = modeAggregate && aggregateFunctions.length > 0
  // a percentage column next to every aggregate function column
  const percentageColumnsVisible = isMeasure && percentageVisible

  const columnNames = isMeasure
    ? // for every measure add a column for each aggregate function
      aggregateFunctions.map((aggregateFn) => ColumnNodeDef.getColumnNameAggregateFunction({ nodeDef, aggregateFn }))
    : ColumnNodeDef.getColumnNames(nodeDef)

  const visibleColumnNames =
    (NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef)) && !isMeasure && !codesVisible
      ? columnNames.filter((colName) => NodeDef.getName(nodeDef) !== colName)
      : columnNames

  const noCols = modeEdit
    ? NodeDefUIProps.getFormFieldsLength(nodeDef)
    : visibleColumnNames.length * (percentageColumnsVisible ? 2 : 1)

  const widthOuter = colWidth * noCols
  const widthInner = `${(1 / noCols) * 100}%`

  return {
    modeEdit,
    columnNames: visibleColumnNames,
    isMeasure,
    aggregateFunctions,
    noCols,
    percentageColumnsVisible,
    widthInner,
    widthOuter,
  }
}
