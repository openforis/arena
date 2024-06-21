import { useCallback, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'
import { useBuildTreeData } from './useBuildEntityTreeData'

export const useEntitySelectorTree = (props) => {
  const { getLabelSuffix, isDisabled, nodeDefLabelType, nodeDefUuidActive, onlyEntities, onlyPages, onSelect } = props
  const survey = useSurvey()

  const { treeItems, treeItemKeys } = useBuildTreeData({
    nodeDefLabelType,
    getLabelSuffix,
    onlyPages,
    onlyEntities,
    isDisabled,
  })

  const [expanded, setExpanded] = useState(true)
  const [expandedNodeDefUuids, setExpandedNodeDefUuids] = useState(treeItemKeys)
  const selectedTreeItemKeys = useMemo(() => (nodeDefUuidActive ? [nodeDefUuidActive] : []), [nodeDefUuidActive])

  const toggleExpanded = useCallback(() => {
    const expandedNext = !expanded
    setExpanded(expandedNext)
    if (expandedNext) {
      setExpandedNodeDefUuids(treeItemKeys)
    } else {
      setExpandedNodeDefUuids([])
    }
  }, [expanded, treeItemKeys])

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
