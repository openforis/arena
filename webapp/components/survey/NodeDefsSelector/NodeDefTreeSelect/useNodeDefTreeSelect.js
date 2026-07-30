import { useCallback, useEffect, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'
import { useBuildTreeData } from './useBuildEntityTreeData'

/**
 * Collects item keys that have at least one real (visible) child.
 * Nodes with only a hidden hasSubPages placeholder are excluded so they
 * start collapsed instead of showing an expanded arrow with no children.
 *
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
    setExpandedNodeDefUuids,
    toggleExpanded,
    treeItems,
  }
}
