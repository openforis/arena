import { ColumnNodeDef } from '@common/model/db'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import { Query } from '@common/model/query'

export const useColumn = ({ colWidth, query, nodeDef }) => {
  const modeEdit = Query.isModeRawEdit(query)

  const colNames = []
  if (Query.isModeAggregate(query) && Query.getMeasures(query).has(NodeDef.getUuid(nodeDef))) {
    // for every measure add a column for each aggregate function
    const aggregateFns = Query.getMeasures(query).get(NodeDef.getUuid(nodeDef))
    aggregateFns.forEach((aggregateFn) => colNames.push(`${ColumnNodeDef.getColName(nodeDef)}_${aggregateFn}`))
  } else {
    colNames.push(...ColumnNodeDef.getColNames(nodeDef))
  }
  const noCols = modeEdit ? NodeDefUIProps.getFormFields(nodeDef).length : colNames.length

  const widthOuter = colWidth * noCols
  const widthInner = `${(1 / noCols) * 100}%`

  return { colNames, modeEdit, noCols, widthInner, widthOuter }
}
