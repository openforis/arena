import './TreeView.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'

export const TreeView = (props) => {
  const {
    items,
    expadedItemKeys = undefined,
    onExpandedItemKeysChange = undefined,
    selectedItemKeys = undefined,
    onSelectedItemKeysChange = undefined,
  } = props

  const toTreeItem = (item) => {
    const { key, label, items } = item
    return (
      <TreeItem key={key} itemId={key} label={label}>
        {items?.map((childItem) => toTreeItem(childItem))}
      </TreeItem>
    )
  }

  const onExpandedItemsChange = useCallback(
    (event, itemIds) => {
      const treeItemKeysBeingCollapsed = expadedItemKeys.filter(
        (oldExpandedItemId) => !itemIds.includes(oldExpandedItemId)
      )
      if (treeItemKeysBeingCollapsed.length > 0 && event?.target?.className === 'MuiTreeItem-label') {
        // do not collapse item if it is expanded and label is clicked; handle only selection;
        return false
      }
      onExpandedItemKeysChange?.(itemIds)
    },
    [expadedItemKeys, onExpandedItemKeysChange]
  )

  const onSelectedItemsChange = useCallback(
    (_event, itemIds) => {
      onSelectedItemKeysChange(itemIds)
    },
    [onSelectedItemKeysChange]
  )

  return (
    <SimpleTreeView
      expandedItems={expadedItemKeys}
      onExpandedItemsChange={onExpandedItemsChange}
      onSelectedItemsChange={onSelectedItemsChange}
      selectedItems={selectedItemKeys}
    >
      {items.map(toTreeItem)}
    </SimpleTreeView>
  )
}

TreeView.propTypes = {
  expadedItemKeys: PropTypes.array,
  items: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string.isRequired, label: PropTypes.string.isRequired }))
    .isRequired,
  onExpandedItemKeysChange: PropTypes.func,
  onSelectedItemKeysChange: PropTypes.func,
  selectedItemKeys: PropTypes.array,
}
