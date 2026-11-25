import './TreeView.scss'

import { useCallback } from 'react'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem as MuiTreeItem } from '@mui/x-tree-view/TreeItem'

import { Objects } from '@openforis/arena-core'

import { ArrayUtils } from '@core/arrayUtils'
import { LabelWithTooltip } from '../form/LabelWithTooltip'

type TreeItem = {
  key: string
  disabled?: boolean
  hasSubPages?: boolean
  icon?: any
  items?: TreeItem[]
  label: string
  testId?: string
}

type TreeItemViewProps = {
  item?: TreeItem
  renderItemPrefix?: (...args: any[]) => any
  renderItemSuffix?: (...args: any[]) => any
  expandedItemKeys?: any[]
}

const TreeItemView = (props: TreeItemViewProps) => {
  const { item, renderItemPrefix, renderItemSuffix, expandedItemKeys } = props
  const { key, disabled, hasSubPages, icon, label, items, testId } = item
  const isExpanded = Boolean(expandedItemKeys?.includes(key))
  const prefix = renderItemPrefix?.(item, { isExpanded })
  const suffix = renderItemSuffix?.(item, { isExpanded })

  return (
    <MuiTreeItem
      key={key}
      disabled={disabled}
      itemId={key}
      label={
        <div className="tree-item-label display-flex">
          {prefix}
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
            renderItemPrefix={renderItemPrefix}
            renderItemSuffix={renderItemSuffix}
            expandedItemKeys={expandedItemKeys}
          />
        ))
      )}
    </MuiTreeItem>
  )
}

type TreeViewProps = {
  disableSelection?: boolean
  expadedItemKeys?: any[]
  items: TreeItem[]
  onExpandedItemKeysChange?: (...args: any[]) => any
  onSelectedItemKeysChange?: (...args: any[]) => any
  selectedItemKeys?: any[]
  renderItemPrefix?: (...args: any[]) => any
  renderItemSuffix?: (...args: any[]) => any
}

export const TreeView = (props: TreeViewProps) => {
  const {
    disableSelection,
    items,
    expadedItemKeys = undefined,
    onExpandedItemKeysChange = undefined,
    selectedItemKeys = undefined,
    onSelectedItemKeysChange = undefined,
    renderItemPrefix = undefined,
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
          renderItemPrefix={renderItemPrefix}
          renderItemSuffix={renderItemSuffix}
          expandedItemKeys={expadedItemKeys}
        />
      ))}
    </SimpleTreeView>
  )
}
