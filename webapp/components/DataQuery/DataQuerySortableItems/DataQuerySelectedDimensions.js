import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import { ArrayUtils } from '@core/arrayUtils'

import { Query } from '@common/model/query'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'

import { DataQuerySortableItems } from './DataQuerySortableItems'

export const DataQuerySelectedDimensions = (props) => {
  const { nodeDefLabelType } = props

  const query = DataExplorerSelectors.useQuery()
  const dimensionsDefUuids = Query.getDimensions(query)
  const onChangeQuery = DataExplorerHooks.useSetQuery()

  const onDimensionsUpdate = useCallback(
    (dimensionDefUuids) => {
      onChangeQuery(Query.assocDimensions(dimensionDefUuids)(query))
    },
    [onChangeQuery, query]
  )

  const onDimensionsSort = useCallback(
    (sortedDimensionDefs) => onDimensionsUpdate(sortedDimensionDefs.map(NodeDef.getUuid)),
    [onDimensionsUpdate]
  )

  const onDimensionDelete = useCallback(
    (dimensionDef) => {
      const dimensionsUpdated = ArrayUtils.removeItem({ item: NodeDef.getUuid(dimensionDef) })(dimensionsDefUuids)
      onDimensionsUpdate(dimensionsUpdated)
    },
    [dimensionsDefUuids, onDimensionsUpdate]
  )

  return (
    <DataQuerySortableItems
      attributeDefUuids={dimensionsDefUuids}
      label="dataView.selectedDimensions"
      nodeDefLabelType={nodeDefLabelType}
      onItemDelete={onDimensionDelete}
      onItemsSort={onDimensionsSort}
    />
  )
}

DataQuerySelectedDimensions.propTypes = {
  nodeDefLabelType: PropTypes.string,
}
