import { useCallback, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'
import { useBuildTreeData } from './useBuildEntityTreeData'

export const useNodeDefTreeSelect = (props) => {
  const {
    getLabelSuffix,
    isDisabled,
    nodeDefLabelType,
    nodeDefUuidActive,
    includeMultipleAttributes,
    includeSingleAttributes,
    includeSingleEntities,
    onlyPages,
    onSelect,
  } = props
  const survey = useSurvey()

  const { treeItems, treeItemKeys } = useBuildTreeData({
    nodeDefLabelType,
    getLabelSuffix,
    onlyPages,
    includeMultipleAttributes,
    includeSingleAttributes,
    includeSingleEntities,
    isDisabled,
  })
  const rootItemKey = treeItems[0]?.key

  const [expanded, setExpanded] = useState(true)
  const [expandedNodeDefUuids, setExpandedNodeDefUuids] = useState(treeItemKeys)
  const selectedTreeItemKeys = useMemo(() => (nodeDefUuidActive ? [nodeDefUuidActive] : []), [nodeDefUuidActive])

  const toggleExpanded = useCallback(() => {
    const expandedNext = !expanded
    setExpanded(expandedNext)
    const itemKeysToExpand = expandedNext ? treeItemKeys : [rootItemKey]
    setExpandedNodeDefUuids(itemKeysToExpand)
  }, [expanded, rootItemKey, treeItemKeys])

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
