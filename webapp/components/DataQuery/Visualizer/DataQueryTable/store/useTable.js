import { useLayoutEffect, useState } from 'react'

import { ColumnNodeDef } from '@common/model/db'
import { Query } from '@common/model/query'

import { elementOffset } from '@webapp/utils/domUtils'

import { DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useNodeDefsByUuids } from '@webapp/store/survey'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import { useListenOnNodeUpdates } from './hooks/useListenToNodeUpdates'

export const useTable = ({ data, setData }) => {
  const nodeDefsSelectorVisible = DataExplorerSelectors.useIsNodeDefsSelectorVisible()
  const query = DataExplorerSelectors.useQuery()

  const [colWidth, setColWidth] = useState(null)

  const nodeDefColUuids = Query.isModeAggregate(query)
    ? [...Query.getDimensions(query), ...Query.getMeasuresKeys(query)]
    : Query.getAttributeDefUuids(query)
  const nodeDefCols = useNodeDefsByUuids(nodeDefColUuids)
  const columnNames = nodeDefCols.flatMap(ColumnNodeDef.getColumnNames)
  const colsNumber = Query.isModeRawEdit(query)
    ? nodeDefCols.reduce((tot, nodeDefCol) => tot + NodeDefUIProps.getFormFieldsLength(nodeDefCol), 0)
    : columnNames.length

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
