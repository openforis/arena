import { ColumnNodeDef } from '@common/model/db'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import { Query } from '@common/model/query'

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

  const noCols = modeEdit ? NodeDefUIProps.getFormFields(nodeDef).length : colNames.length

  const widthOuter = colWidth * noCols
  const widthInner = `${(1 / noCols) * 100}%`

  return { modeEdit, colNames, isMeasure, aggregateFunctions, noCols, widthInner, widthOuter }
}
