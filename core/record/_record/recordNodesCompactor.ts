import type { Node as ArenaNode } from '@openforis/arena-core'

import { NodeMeta } from '../_node/nodeMeta'
import * as NodeRefData from '../nodeRefData'
import { valuePropsCode, valuePropsTaxon } from '@core/survey/nodeValueProps'

const { keys: refDataKeys } = NodeRefData
const { metaKeys } = NodeMeta

const valueUuidProps = [valuePropsCode.itemUuid, valuePropsTaxon.taxonUuid, valuePropsTaxon.vernacularNameUuid]

type NodeCompactor = (node: ArenaNode) => ArenaNode

const internArrayItems = (array: string[] | undefined, intern: (value: string) => string): void => {
  if (!array) return
  for (let i = 0; i < array.length; i++) {
    array[i] = intern(array[i])
  }
}

const getRefDataKey = (refData: any): string | null => {
  const categoryItem = refData?.[refDataKeys.categoryItem]
  if (categoryItem?.uuid) return `c|${categoryItem.uuid}`
  const taxon = refData?.[refDataKeys.taxon]
  if (taxon?.uuid) return `t|${taxon.uuid}|${taxon.vernacularNameUuid ?? ''}`
  return null
}

/**
 * Creates a function that reduces the memory used by the nodes of the same record (or batch of nodes),
 * modifying them in place: identical uuid strings (parsed from db rows or JSON) and ref data objects
 * are shared among the nodes instead of being duplicated in every node.
 * Only existing properties are reassigned, so the node objects keep their (fast mode) shape.
 * @returns {Function} - Function compacting a node and returning it.
 */
const createCompactor = (): NodeCompactor => {
  const stringsPool = new Map<string, string>()
  const refDataPool = new Map<string, any>()

  const intern = (value: string): string => {
    if (typeof value !== 'string') return value
    const pooled = stringsPool.get(value)
    if (pooled !== undefined) return pooled
    stringsPool.set(value, value)
    return value
  }

  return (node: any): ArenaNode => {
    for (const key of ['uuid', 'parentUuid', 'recordUuid', 'nodeDefUuid', 'surveyUuid']) {
      if (node[key]) node[key] = intern(node[key])
    }
    const meta = node.meta
    if (meta) {
      internArrayItems(meta[metaKeys.hierarchy], intern)
      internArrayItems(meta[metaKeys.hierarchyCode], intern)
    }
    const value = node.value
    if (value && typeof value === 'object') {
      for (const key of valueUuidProps) {
        if (value[key]) value[key] = intern(value[key])
      }
    }
    const refDataKey = getRefDataKey(node.refData)
    if (refDataKey) {
      const refDataPooled = refDataPool.get(refDataKey)
      if (refDataPooled) {
        node.refData = refDataPooled
      } else {
        refDataPool.set(refDataKey, node.refData)
      }
    }
    return node
  }
}

/**
 * Compacts the given nodes in place (see createCompactor).
 * @param {object|Array} nodes - Nodes array or nodes indexed by uuid.
 * @returns {object|Array} - The same nodes object.
 */
const compactNodes = <T extends ArenaNode[] | Record<string, ArenaNode>>(nodes: T): T => {
  if (!nodes) return nodes
  const compact = createCompactor()
  for (const node of Object.values(nodes)) {
    compact(node)
  }
  return nodes
}

export const RecordNodesCompactor = {
  createCompactor,
  compactNodes,
}
