import React, { useMemo } from 'react'

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

/**
 * Collects all descendant page UUIDs under a tree item.
 *
 * @param item - Tree item
 * @returns Descendant page node def UUIDs
 */
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
 * Builds a map of page UUID → that page's descendant page UUIDs for the subtree.
 *
 * @param item - Root tree item of the subtree
 * @returns Map of page UUID to descendant UUIDs
 */
const buildDescendantPageUuidsByPage = (item: TreeItemLike): Record<string, string[]> => {
  const map: Record<string, string[]> = {}
  const visit = (node: TreeItemLike) => {
    map[node.key] = collectDescendantPageUuids(node)
    node.items?.forEach(visit)
  }
  visit(item)
  return map
}

/**
 * Renders the entry-mode status icon for one sidebar tree item.
 *
 * @param item - Tree item (key = page node def UUID)
 * @param isExpanded - Whether the tree item is expanded
 * @returns Status icon element or null
 */
export const RecordTreeItemStatusSuffix = ({ item, isExpanded }: Props) => {
  const descendantPageUuids = useMemo(() => collectDescendantPageUuids(item), [item])
  const descendantPageUuidsByPage = useMemo(() => buildDescendantPageUuidsByPage(item), [item])
  const { hasErrors, hasWarnings, isComplete } = useRecordTreeItemStatus({
    pageNodeDefUuid: item.key,
    descendantPageUuids,
    descendantPageUuidsByPage,
    isTreeItemExpanded: isExpanded,
  })
  return <RecordPageStatusIcon hasErrors={hasErrors} hasWarnings={hasWarnings} isComplete={isComplete} />
}
