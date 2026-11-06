import './DataQuerySortableItems.scss'

import React, { useRef } from 'react'

import * as NodeDef from '@core/survey/nodeDef'

import { useSortable } from '@webapp/components/hooks'

import { useNodeDefsByUuids } from '@webapp/store/survey'

import { QuerySidebarSection } from '../QuerySidebar/QuerySidebarSection'
import { DataQuerySortableItem } from './DataQuerySortableItem'

type Props = {
  label: string
  nodeDefLabelType?: string
  nodeDefUuids: string[]
  onItemDelete: (nodeDef: any) => void
  onItemsSort: (nodeDefs: any[]) => void
  renderItemExtra?: (nodeDef: any) => React.ReactNode
}

/**
 * Sidebar section with the selected variables of the query, numbered and sortable with drag and drop.
 * @param {Props} props - The component props.
 * @returns {React.ReactElement|null} - The section, or null when no variable is selected.
 */
export const DataQuerySortableItems = (props: Props) => {
  const { label, nodeDefLabelType, nodeDefUuids, onItemDelete, onItemsSort, renderItemExtra } = props

  const containerRef = useRef(null)
  const nodeDefs = useNodeDefsByUuids(nodeDefUuids)

  useSortable({
    containerRef,
    draggableClassName: '.data-query__sortable-item',
    handleClassName: '.data-query__sortable-item-handle',
    items: nodeDefs,
    onItemsSort,
  })

  if (nodeDefs.length === 0) return null

  return (
    <QuerySidebarSection count={nodeDefs.length} label={label}>
      <div className="data-query__sortable-items" ref={containerRef}>
        {nodeDefs.map((nodeDef, index) => (
          <DataQuerySortableItem
            key={NodeDef.getUuid(nodeDef)}
            index={index}
            nodeDef={nodeDef}
            nodeDefLabelType={nodeDefLabelType}
            onDelete={onItemDelete}
          >
            {renderItemExtra?.(nodeDef)}
          </DataQuerySortableItem>
        ))}
      </div>
    </QuerySidebarSection>
  )
}
