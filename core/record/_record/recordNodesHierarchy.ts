import type { ArenaRecordNode } from '@openforis/arena-core'

import { NodeMeta } from '../_node/nodeMeta'

const { metaKeys } = NodeMeta

/**
 * Sets the meta hierarchy (ancestor uuids, root first) of the given nodes, rebuilding it from their parent uuids
 * (the hierarchy is not stored in the db). The nodes must include all the ancestors of each node (e.g. all the nodes of a record);
 * a node whose ancestors are not all included keeps its current meta hierarchy.
 * The nodes are modified in place; siblings share the same (not to be modified) hierarchy array, to save memory.
 * @param nodes - The nodes (array or indexed by uuid).
 * @returns The same nodes.
 */
const assocHierarchies = <T extends ArenaRecordNode[] | Record<string, ArenaRecordNode>>(nodes: T): T => {
  const nodesArray: ArenaRecordNode[] = Object.values(nodes)
  const nodesByUuid = new Map<string, ArenaRecordNode>()
  for (const node of nodesArray) {
    nodesByUuid.set(node.uuid, node)
  }
  // hierarchy of the children of a node, by node uuid (null if some ancestors are missing)
  const childrenHierarchyByParentUuid = new Map<string, string[] | null>()

  const getChildrenHierarchy = (parentUuid: string): string[] | null => {
    if (childrenHierarchyByParentUuid.has(parentUuid)) return childrenHierarchyByParentUuid.get(parentUuid)!
    const parent = nodesByUuid.get(parentUuid)
    let hierarchy: string[] | null = null
    if (parent) {
      const parentHierarchy = parent.parentUuid ? getChildrenHierarchy(parent.parentUuid) : []
      hierarchy = parentHierarchy ? [...parentHierarchy, parentUuid] : null
    }
    childrenHierarchyByParentUuid.set(parentUuid, hierarchy)
    return hierarchy
  }

  for (const node of nodesArray) {
    const hierarchy = node.parentUuid ? getChildrenHierarchy(node.parentUuid) : []
    if (hierarchy) {
      node.meta = node.meta ?? {}
      node.meta[metaKeys.hierarchy] = hierarchy
    }
  }
  return nodes
}

export const RecordNodesHierarchy = {
  assocHierarchies,
}
