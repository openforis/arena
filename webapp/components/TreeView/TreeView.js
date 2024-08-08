import './TreeView.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem as MuiTreeItem } from '@mui/x-tree-view/TreeItem'
import { Objects } from '@openforis/arena-core'

import { ArrayUtils } from '@core/arrayUtils'

import { LabelWithTooltip } from '../form/LabelWithTooltip'

const TreeItemPropTypes = PropTypes.shape({
  key: PropTypes.string.isRequired,
  icon: PropTypes.any,
  items: PropTypes.array,
  label: PropTypes.string.isRequired,
  testId: PropTypes.string,
})

const TreeItemView = (props) => {
  const { item } = props
  const { key, icon, label, items, testId } = item
  return (
    <MuiTreeItem
      key={key}
      itemId={key}
      label={
        <div className="tree-item-label display-flex">
          {icon}
          <LabelWithTooltip label={label} />
        </div>
      }
      data-testid={testId}
    >
      {items?.map((childItem) => (
        <TreeItemView key={childItem.key} item={childItem} />
      ))}
    </MuiTreeItem>
  )
}

TreeItemView.propTypes = {
  item: TreeItemPropTypes,
}

export const TreeView = (props) => {
  const {
    items,
    expadedItemKeys = undefined,
    onExpandedItemKeysChange = undefined,
    selectedItemKeys = undefined,
    onSelectedItemKeysChange = undefined,
  } = props

  const onExpandedItemsChange = useCallback(
    (event, itemIds) => {
      const treeItemKeysBeingCollapsed = expadedItemKeys.filter(
        (oldExpandedItemId) => !itemIds.includes(oldExpandedItemId)
      )
      const targetClass = String(event?.target?.className)
      if (treeItemKeysBeingCollapsed.length > 0 && targetClass.includes('label')) {
        // do not collapse item if it is expanded and label is clicked; handle only selection;
        return false
      }
      onExpandedItemKeysChange?.(itemIds)
    },
    [expadedItemKeys, onExpandedItemKeysChange]
  )

  const onSelectedItemsChange = useCallback(
    (_event, itemIds) => {
      if (!Objects.isEqual(selectedItemKeys, ArrayUtils.toArray(itemIds))) {
        onSelectedItemKeysChange(itemIds)
      }
    },
    [onSelectedItemKeysChange, selectedItemKeys]
  )

  return (
    <SimpleTreeView
      expandedItems={expadedItemKeys}
      onExpandedItemsChange={onExpandedItemsChange}
      onSelectedItemsChange={onSelectedItemsChange}
      selectedItems={selectedItemKeys}
    >
      {items.map((childItem) => (
        <TreeItemView key={childItem.key} item={childItem} />
      ))}
    </SimpleTreeView>
  )
}

TreeView.propTypes = {
  expadedItemKeys: PropTypes.array,
  items: PropTypes.arrayOf(TreeItemPropTypes).isRequired,
  onExpandedItemKeysChange: PropTypes.func,
  onSelectedItemKeysChange: PropTypes.func,
  selectedItemKeys: PropTypes.array,
}
