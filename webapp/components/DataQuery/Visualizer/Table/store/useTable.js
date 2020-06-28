import { useLayoutEffect, useState } from 'react'

import { ColumnNodeDef } from '@common/model/db'
import { Query } from '@common/model/query'
import * as NodeDefUIProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'
import { elementOffset } from '@webapp/utils/domUtils'

import { useNodeDefsByUuids } from '@webapp/store/survey'

import { useListenOnNodeUpdates } from './hooks/useListenToNodeUpdates'

export const useTable = ({ data, query, nodeDefsSelectorVisible, setData }) => {
  const [colWidth, setColWidth] = useState(null)

  const nodeDefCols = useNodeDefsByUuids(Query.getAttributeDefUuids(query))
  const colNames = nodeDefCols.flatMap((nodeDefCol) => ColumnNodeDef.getColNames(nodeDefCol))
  const colsNumber = Query.isModeRawEdit(query)
    ? nodeDefCols.reduce((tot, nodeDefCol) => tot + NodeDefUIProps.getFormFields(nodeDefCol).length, 0)
    : colNames.length

  const colIndexWidth = 70

  useLayoutEffect(() => {
    const { width } = elementOffset(document.getElementsByClassName('data-query__container')[0])
    const widthMax = width - colIndexWidth - 22
    const colWidthMin = 150
    const colWidthUpdate = widthMax > colsNumber * colWidthMin ? Math.floor(widthMax / colsNumber) : colWidthMin
    setColWidth(colWidthUpdate)
  }, [nodeDefsSelectorVisible, colsNumber])

  useListenOnNodeUpdates({ data, query, setData })

  return { colWidth, colIndexWidth, nodeDefCols }
}
