import { useCallback } from 'react'

import { Query } from '@common/model/query'
import { ArrayUtils } from '@core/arrayUtils'
import * as NodeDef from '@core/survey/nodeDef'
import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'

import { DataQuerySortableItems } from './DataQuerySortableItems'

type DataQuerySelectedAttributesProps = {
  nodeDefLabelType?: NodeDef.NodeDefLabelType
}

export const DataQuerySelectedAttributes = (props: DataQuerySelectedAttributesProps) => {
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
      label="common.attribute_other"
      nodeDefLabelType={nodeDefLabelType}
      nodeDefUuids={attributeDefUuids}
      onItemDelete={onAttributeDelete}
      onItemsSort={onAttributeDefsSort}
    />
  )
}
