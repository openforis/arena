import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import { ArrayUtils } from '@core/arrayUtils'

import { Query } from '@common/model/query'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'

import { DataQuerySortableItems } from './DataQuerySortableItems'

export const DataQuerySelectedAttributes = (props) => {
  const { nodeDefLabelType } = props

  const query = DataExplorerSelectors.useQuery()
  const attributeDefUuids = Query.getAttributeDefUuids(query)
  const onChangeQuery = DataExplorerHooks.useSetQuery()

  const onAttributeDefsSort = useCallback(
    (sortedAttributeDefs) => {
      onChangeQuery(Query.assocAttributeDefUuids(sortedAttributeDefs.map(NodeDef.getUuid))(query))
    },
    [onChangeQuery, query]
  )

  const onAttributeDelete = useCallback(
    (attributeDef) => {
      const attributeDefUuids = Query.getAttributeDefUuids(query)
      const attributeDefUuidsUpdated = ArrayUtils.removeItem({ item: NodeDef.getUuid(attributeDef) })(attributeDefUuids)
      onChangeQuery(Query.assocAttributeDefUuids(attributeDefUuidsUpdated)(query))
    },
    [onChangeQuery, query]
  )

  return (
    <DataQuerySortableItems
      attributeDefUuids={attributeDefUuids}
      label="dataView.selectedAttributes"
      nodeDefLabelType={nodeDefLabelType}
      onItemDelete={onAttributeDelete}
      onItemsSort={onAttributeDefsSort}
    />
  )
}

DataQuerySelectedAttributes.propTypes = {
  nodeDefLabelType: PropTypes.string,
}
