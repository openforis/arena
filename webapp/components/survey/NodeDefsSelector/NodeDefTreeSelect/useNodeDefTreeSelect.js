import { useCallback, useEffect, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'
import { useBuildTreeData } from './useBuildEntityTreeData'

/**
 * Collects item keys that have at least one real (visible) child.
 * Nodes with only a hidden hasSubPages placeholder are excluded so they
 * start collapsed instead of showing an expanded arrow with no children.
 * @param {Array<{ key: string, items?: Array }>} items - Tree items
 * @returns {string[]} Keys of expandable items
 */
const collectExpandableItemKeys = (items) => {
  const keys = []
  const visit = (item) => {
    if (item?.items?.length > 0) {
      keys.push(item.key)
      item.items.forEach(visit)
    }
  }
  items?.forEach(visit)
  return keys
}

/**
 * Finds a tree item by key.
 * @param {Array<{ key: string, items?: Array }>} items - Tree items
 * @param {string} key - Item key to find
 * @returns {{ key: string, items?: Array } | null} Matching item or null
 */
const findTreeItemByKey = (items, key) => {
  for (const item of items ?? []) {
    if (item.key === key) return item
    const found = findTreeItemByKey(item.items, key)
    if (found) return found
  }
  return null
}

/**
 * Collects expandable descendant keys under a tree item (not including the item itself).
 * @param {{ key: string, items?: Array }} item - Tree item
 * @returns {string[]} Expandable descendant keys
 */
const collectExpandableDescendantKeys = (item) => {
  const keys = []
  const visit = (child) => {
    if (child?.items?.length > 0) {
      keys.push(child.key)
      child.items.forEach(visit)
    }
  }
  item?.items?.forEach(visit)
  return keys
}

export const useNodeDefTreeSelect = (props) => {
  const {
    getLabelSuffix,
    isNodeDefDisabled,
    isNodeDefIncluded,
    nodeDefLabelType,
    nodeDefUuidActive,
    includeMultipleAttributes,
    includeSingleAttributes,
    includeSingleEntities,
    onlyPages,
    onSelect,
  } = props
  const survey = useSurvey()

  const { treeItems } = useBuildTreeData({
    nodeDefLabelType,
    getLabelSuffix,
    onlyPages,
    includeMultipleAttributes,
    includeSingleAttributes,
    includeSingleEntities,
    isNodeDefDisabled,
    isNodeDefIncluded,
  })
  const rootItemKey = treeItems[0]?.key

  const expandableItemKeys = useMemo(() => collectExpandableItemKeys(treeItems), [treeItems])
  const expandableItemKeysKey = expandableItemKeys.join('|')

  const [expanded, setExpanded] = useState(true)
  const [expandedNodeDefUuids, setExpandedNodeDefUuids] = useState(expandableItemKeys)
  const selectedTreeItemKeys = useMemo(() => (nodeDefUuidActive ? [nodeDefUuidActive] : []), [nodeDefUuidActive])

  useEffect(() => {
    if (expanded) {
      setExpandedNodeDefUuids(expandableItemKeys)
    }
    // Re-sync only when expandable set changes while expanded mode is on.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: expandableItemKeysKey tracks content
  }, [expanded, expandableItemKeysKey])

  const toggleExpanded = useCallback(() => {
    const expandedNext = !expanded
    setExpanded(expandedNext)
    setExpandedNodeDefUuids(expandedNext ? expandableItemKeys : [rootItemKey])
  }, [expanded, expandableItemKeys, rootItemKey])

  /**
   * Updates expanded keys. When a node is newly expanded, also expands all of
   * its expandable descendants so one click opens the whole subtree.
   * @param {string[]} itemIds - Expanded item keys from the tree view
   * @returns {void}
   */
  const onExpandedItemKeysChange = useCallback(
    (itemIds) => {
      const previous = new Set(expandedNodeDefUuids)
      const next = new Set(itemIds)
      const newlyExpanded = itemIds.filter((id) => !previous.has(id))

      for (const key of newlyExpanded) {
        const item = findTreeItemByKey(treeItems, key)
        if (!item) continue
        for (const descendantKey of collectExpandableDescendantKeys(item)) {
          next.add(descendantKey)
        }
      }

      setExpandedNodeDefUuids([...next])
    },
    [expandedNodeDefUuids, treeItems]
  )

  const onSelectedTreeItemKeyChange = useCallback(
    (selectedNodeDefUuid) => {
      const selectedNodeDef = Survey.getNodeDefByUuid(selectedNodeDefUuid)(survey)
      onSelect(selectedNodeDef)
    },
    [onSelect, survey]
  )

  return {
    expanded,
    expandedNodeDefUuids,
    onSelectedTreeItemKeyChange,
    selectedTreeItemKeys,
    setExpandedNodeDefUuids: onExpandedItemKeysChange,
    toggleExpanded,
    treeItems,
  }
}
