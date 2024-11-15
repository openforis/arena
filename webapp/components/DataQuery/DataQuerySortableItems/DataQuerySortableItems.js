import './DataQuerySortableItems.scss'

import React, { useRef } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { FormItem } from '@webapp/components/form/Input'
import { useSortable } from '@webapp/components/hooks'

import { useNodeDefsByUuids } from '@webapp/store/survey'

import { DataQuerySortableItemChip } from './DataQuerySortableItemChip'

export const DataQuerySortableItems = (props) => {
  const { nodeDefUuids, label, nodeDefLabelType, onItemsSort, onItemDelete } = props

  const containerRef = useRef(null)
  const nodeDefs = useNodeDefsByUuids(nodeDefUuids)

  useSortable({
    containerRef,
    draggableClassName: '.data-query__sortable-item-chip',
    handleClassName: '.data-query__sortable-item-chip .MuiChip-label',
    items: nodeDefs,
    onItemsSort,
  })

  if (nodeDefs.length === 0) return null

  return (
    <FormItem className="data-query__sortable-items-form-item" info="dataView.sortableItemsInfo" label={label}>
      <div className="data-query__sortable-items-wrapper" ref={containerRef}>
        {nodeDefs.map((nodeDef) => (
          <DataQuerySortableItemChip
            key={NodeDef.getUuid(nodeDef)}
            nodeDefDef={nodeDef}
            nodeDefLabelType={nodeDefLabelType}
            onDelete={onItemDelete}
          />
        ))}
      </div>
    </FormItem>
  )
}

DataQuerySortableItems.propTypes = {
  nodeDefUuids: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired,
  nodeDefLabelType: PropTypes.string,
  onItemsSort: PropTypes.func.isRequired,
  onItemDelete: PropTypes.func.isRequired,
}
