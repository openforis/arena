import './DataQuerySortableItems.scss'

import { useRef } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import { FormItem } from '@webapp/components/form/Input'
import { useSortable } from '@webapp/components/hooks'
import { useNodeDefsByUuids } from '@webapp/store/survey'

import { DataQuerySortableItemChip } from './DataQuerySortableItemChip'

type DataQuerySortableItemsProps = {
  nodeDefUuids: any[]
  label: string
  nodeDefLabelType?: NodeDef.NodeDefLabelType
  onItemsSort: (...args: any[]) => any
  onItemDelete: (...args: any[]) => any
  // extra content rendered inside each item chip (e.g. the measure aggregate functions)
  renderItemExtra?: (...args: any[]) => any
}

export const DataQuerySortableItems = (props: DataQuerySortableItemsProps) => {
  const { nodeDefUuids, label, nodeDefLabelType, onItemsSort, onItemDelete, renderItemExtra = null } = props

  const containerRef = useRef(null)
  const nodeDefs = useNodeDefsByUuids(nodeDefUuids)

  useSortable({
    containerRef,
    draggableClassName: '.data-query__sortable-item-chip',
    handleClassName: '.data-query__sortable-item-chip-label',
    items: nodeDefs,
    onItemsSort,
  })

  if (nodeDefs.length === 0) return null

  return (
    <FormItem className="data-query__sortable-items-form-item" info="dataView:sortableItemsInfo" label={label}>
      <div className="data-query__sortable-items-wrapper" ref={containerRef}>
        {nodeDefs.map((nodeDef) => (
          <DataQuerySortableItemChip
            key={NodeDef.getUuid(nodeDef)}
            nodeDefDef={nodeDef}
            nodeDefLabelType={nodeDefLabelType}
            onDelete={onItemDelete}
          >
            {renderItemExtra?.(nodeDef)}
          </DataQuerySortableItemChip>
        ))}
      </div>
    </FormItem>
  )
}
