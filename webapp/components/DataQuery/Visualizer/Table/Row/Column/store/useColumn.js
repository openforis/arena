import { ColumnNodeDef } from '@common/model/db'
import * as NodeDefUIProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

import { Query } from '@common/model/query'

export const useColumn = ({ colWidth, query, nodeDef }) => {
  const modeEdit = Query.isModeRawEdit(query)

  const colNames = ColumnNodeDef.getColNames(nodeDef)
  const noCols = modeEdit ? NodeDefUIProps.getFormFields(nodeDef).length : colNames.length

  const widthOuter = colWidth * noCols
  const widthInner = `${(1 / noCols) * 100}%`

  return { colNames, modeEdit, noCols, widthInner, widthOuter }
}
