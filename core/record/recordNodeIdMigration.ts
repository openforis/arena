import * as ObjectUtils from '@core/objectUtils'

import * as Node from './node'
import * as Record from './record'

/**
 * True if the record's nodes are still linked by uuid/parentUuid (the shape produced by
 * arena-mobile versions built before the node internal-id migration), rather than by iId/pIId.
 * Only the first node is checked: a record is either fully in the legacy shape or fully in the
 * current one, since both shapes are always written by a single client version in one pass.
 */
export const isLegacyNodeFormat = (record: any): boolean => {
  const [firstNode] = Record.getNodesArray(record)
  if (!firstNode) return false
  return !(Node.keys.iId in firstNode) && Node.keys.uuid in firstNode
}

/**
 * Converts a record whose nodes are keyed and linked by uuid/parentUuid into the current
 * iId/pIId-based shape, so it can be handed to the rest of the (iId-only) record model.
 * Internal ids are assigned in hierarchy order (root first), a node's uuid never being needed
 * again once its children have been remapped.
 * A no-op if the record is already in the current shape.
 */
export const migrateRecordToInternalIds = (record: any): any => {
  if (!isLegacyNodeFormat(record)) return record

  const legacyNodes = Record.getNodesArray(record)
  const legacyNodesByDepth = [...legacyNodes].sort(
    (nodeA, nodeB) => Node.getHierarchy(nodeA).length - Node.getHierarchy(nodeB).length
  )

  const iIdByUuid: { [uuid: string]: number } = {}
  const migratedNodesByIId: { [iId: number]: any } = {}
  let lastNodeInternalId = 0

  legacyNodesByDepth.forEach((legacyNode) => {
    const uuid = ObjectUtils.getUuid(legacyNode)
    const parentUuid = ObjectUtils.getParentUuid(legacyNode)

    lastNodeInternalId += 1
    const iId = lastNodeInternalId
    iIdByUuid[uuid] = iId

    const migratedNode = { ...legacyNode }
    delete migratedNode[Node.keys.uuid]
    delete migratedNode[ObjectUtils.keys.parentUuid]
    migratedNode[Node.keys.iId] = iId
    migratedNode[Node.keys.pIId] = parentUuid ? iIdByUuid[parentUuid] : null
    migratedNode[Node.keys.meta] = {
      ...legacyNode[Node.keys.meta],
      [Node.metaKeys.hierarchy]: Node.getHierarchy(legacyNode).map((ancestorUuid: string) => iIdByUuid[ancestorUuid]),
    }

    migratedNodesByIId[iId] = migratedNode
  })

  return {
    ...record,
    [Record.keys.nodes]: migratedNodesByIId,
    [Record.keys.lastNodeInternalId]: lastNodeInternalId,
  }
}
