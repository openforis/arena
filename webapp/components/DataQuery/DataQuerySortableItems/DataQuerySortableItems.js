import './DataQuerySortableItems.scss'

import React, { useRef } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { FormItem } from '@webapp/components/form/Input'
import { useSortable } from '@webapp/components/hooks'

import { useNodeDefsByUuids } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { DataQuerySortableItemChip } from './DataQuerySortableItemChip'

export const DataQuerySortableItems = (props) => {
  const { attributeDefUuids, label, nodeDefLabelType, onItemsSort, onItemDelete } = props

  const i18n = useI18n()
  const containerRef = useRef(null)
  const attributeDefs = useNodeDefsByUuids(attributeDefUuids)

  useSortable({
    containerRef,
    draggableClassName: '.data-query__selected-attribute-chip',
    handleClassName: '.data-query__selected-attribute-chip .MuiChip-label',
    items: attributeDefs,
    onItemsSort,
  })

  if (attributeDefs.length === 0) return null

  return (
    <FormItem className="data-query__sortable-items-form-item" info="dataView.sortableItemsInfo" label={i18n.t(label)}>
      <div className="data-query__sortable-items-wrapper" ref={containerRef}>
        {attributeDefs.map((attributeDef) => (
          <DataQuerySortableItemChip
            key={NodeDef.getUuid(attributeDef)}
            attributeDef={attributeDef}
            nodeDefLabelType={nodeDefLabelType}
            onDelete={onItemDelete}
          />
        ))}
      </div>
    </FormItem>
  )
}

DataQuerySortableItems.propTypes = {
  attributeDefUuids: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired,
  nodeDefLabelType: PropTypes.string,
  onItemsSort: PropTypes.func.isRequired,
  onItemDelete: PropTypes.func.isRequired,
}
