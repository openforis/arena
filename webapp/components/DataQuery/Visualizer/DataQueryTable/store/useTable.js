import { useLayoutEffect, useState } from 'react'

import { ColumnNodeDef } from '@common/model/db'
import { Query } from '@common/model/query'

import { elementOffset } from '@webapp/utils/domUtils'

import { DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useNodeDefsByUuids } from '@webapp/store/survey'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import { useListenOnNodeUpdates } from './hooks/useListenToNodeUpdates'

// measures have a column for every aggregate function (and its percentage, if visible)
const getMeasuresColsNumber = ({ query, percentageVisible }) =>
  Object.values(Query.getMeasures(query)).flat().length * (percentageVisible ? 2 : 1)

export const useTable = ({ data, setData, percentageVisible = false }) => {
  const nodeDefsSelectorVisible = DataExplorerSelectors.useIsNodeDefsSelectorVisible()
  const query = DataExplorerSelectors.useQuery()

  const [colWidth, setColWidth] = useState(null)

  const modeAggregate = Query.isModeAggregate(query)
  const nodeDefColUuids = modeAggregate
    ? [...Query.getDimensions(query), ...Query.getMeasuresKeys(query)]
    : Query.getAttributeDefUuids(query)
  const nodeDefCols = useNodeDefsByUuids(nodeDefColUuids)
  const dimensionDefs = useNodeDefsByUuids(modeAggregate ? Query.getDimensions(query) : [])
  let colsNumber
  if (Query.isModeRawEdit(query)) {
    colsNumber = nodeDefCols.reduce((tot, nodeDefCol) => tot + NodeDefUIProps.getFormFieldsLength(nodeDefCol), 0)
  } else if (modeAggregate) {
    colsNumber =
      dimensionDefs.flatMap(ColumnNodeDef.getColumnNames).length + getMeasuresColsNumber({ query, percentageVisible })
  } else {
    colsNumber = nodeDefCols.flatMap(ColumnNodeDef.getColumnNames).length
  }

  const colIndexWidth = 70

  useLayoutEffect(() => {
    const { width } = elementOffset(document.getElementsByClassName('data-query__container')[0])
    const widthMax = width - colIndexWidth - 22
    const colWidthMin = 150
    const colWidthUpdate = widthMax > colsNumber * colWidthMin ? Math.floor(widthMax / colsNumber) : colWidthMin
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the width is measured from the DOM
    setColWidth(colWidthUpdate)
  }, [nodeDefsSelectorVisible, colsNumber])

  useListenOnNodeUpdates({ data, query, setData })

  return { colWidth, colIndexWidth, nodeDefCols }
}
