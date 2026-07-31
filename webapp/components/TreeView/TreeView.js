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
  disabled: PropTypes.bool,
  hasSubPages: PropTypes.bool,
  icon: PropTypes.any,
  items: PropTypes.array,
  label: PropTypes.string.isRequired,
  testId: PropTypes.string,
})

const TreeItemView = (props) => {
  const { item, renderItemSuffix, expandedItemKeys } = props
  const { key, disabled, hasSubPages, icon, label, items, testId } = item
  const isExpanded = Boolean(expandedItemKeys?.includes(key))
  const suffix = renderItemSuffix?.(item, { isExpanded })

  return (
    <MuiTreeItem
      key={key}
      disabled={disabled}
      itemId={key}
      label={
        <div className="tree-item-label display-flex">
          {icon}
          <LabelWithTooltip label={label} />
          {suffix}
        </div>
      }
      data-testid={testId}
    >
      {hasSubPages && !items?.length ? (
        <MuiTreeItem key={`${key}__placeholder`} itemId={`${key}__placeholder`} label="" sx={{ display: 'none' }} />
      ) : (
        items?.map((childItem) => (
          <TreeItemView
            key={childItem.key}
            item={childItem}
            renderItemSuffix={renderItemSuffix}
            expandedItemKeys={expandedItemKeys}
          />
        ))
      )}
    </MuiTreeItem>
  )
}

TreeItemView.propTypes = {
  item: TreeItemPropTypes,
  renderItemSuffix: PropTypes.func,
  expandedItemKeys: PropTypes.array,
}

export const TreeView = (props) => {
  const {
    disableSelection,
    items,
    expadedItemKeys = undefined,
    onExpandedItemKeysChange = undefined,
    selectedItemKeys = undefined,
    onSelectedItemKeysChange = undefined,
    renderItemSuffix = undefined,
  } = props

  const onExpandedItemsChange = useCallback(
    (event, itemIds) => {
      const treeItemKeysBeingCollapsed = expadedItemKeys.filter(
        (oldExpandedItemId) => !itemIds.includes(oldExpandedItemId)
      )
      // Use closest() so clicks on SVG status icons inside the label are treated
      // as label clicks (SVG className is SVGAnimatedString, not a plain string).
      const isLabelClick = Boolean(event?.target?.closest?.('.MuiTreeItem-label, .tree-item-label'))
      if (treeItemKeysBeingCollapsed.length > 0 && isLabelClick) {
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
      disableSelection={disableSelection}
      expandedItems={expadedItemKeys}
      onExpandedItemsChange={onExpandedItemsChange}
      onSelectedItemsChange={onSelectedItemsChange}
      selectedItems={selectedItemKeys}
    >
      {items.map((childItem) => (
        <TreeItemView
          key={childItem.key}
          item={childItem}
          renderItemSuffix={renderItemSuffix}
          expandedItemKeys={expadedItemKeys}
        />
      ))}
    </SimpleTreeView>
  )
}

TreeView.propTypes = {
  disableSelection: PropTypes.bool,
  expadedItemKeys: PropTypes.array,
  items: PropTypes.arrayOf(TreeItemPropTypes).isRequired,
  onExpandedItemKeysChange: PropTypes.func,
  onSelectedItemKeysChange: PropTypes.func,
  selectedItemKeys: PropTypes.array,
  renderItemSuffix: PropTypes.func,
}
