import React from 'react'

import { useRecordTreeItemStatus } from '@webapp/store/ui/record'

import { RecordPageStatusIcon } from './RecordPageStatusIcon'

type TreeItemLike = {
  key: string
  items?: TreeItemLike[]
}

type Props = {
  item: TreeItemLike
  isExpanded: boolean
}

const collectDescendantPageUuids = (item: TreeItemLike): string[] => {
  const uuids: string[] = []
  const visit = (child: TreeItemLike) => {
    uuids.push(child.key)
    child.items?.forEach(visit)
  }
  item.items?.forEach(visit)
  return uuids
}

/**
 * Renders the entry-mode status icon for one sidebar tree item.
 *
 * @param item - Tree item (key = page node def UUID)
 * @param isExpanded - Whether the tree item is expanded
 * @returns Status icon element or null
 */
export const RecordTreeItemStatusSuffix = ({ item, isExpanded }: Props) => {
  const descendantPageUuids = collectDescendantPageUuids(item)
  const { hasErrors, hasWarnings, isComplete } = useRecordTreeItemStatus({
    pageNodeDefUuid: item.key,
    descendantPageUuids,
    isTreeItemExpanded: isExpanded,
  })
  return <RecordPageStatusIcon hasErrors={hasErrors} hasWarnings={hasWarnings} isComplete={isComplete} />
}
