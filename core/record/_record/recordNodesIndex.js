import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as Node from '../node'

/**
 * Record nodes index.
 *
 * Index items:
 *
 * nodeRootUuid: uuid of root node
 *
 * nodesByParentAndDef: stores the list of child node uuids ['node-1-uuid', 'node-2-uuid', ...]
 *                      indexed by node def uuid (node-def-1-uuid, node-def-2-uuid)
 *                      for each entity uuid (parent-node-1-uuid)
 *
 *   e.g.:
 *   nodesByParentAndChildDef = {
 *     'parent-node-1-uuid': {
 *       'node-def-1-uuid': ['node-1-uuid', 'node-2-uuid', ...]
 *       'node-def-2-uuid': ['node-3-uuid', 'node-4-uuid', ...]
 *     },
 *     'parent-node-2-uuid': {
 *       'node-def-1-uuid': ['node-5-uuid', 'node-6-uuid', ...]
 *       'node-def-2-uuid': ['node-7-uuid', 'node-8-uuid', ...]
 *     }
 *   }
 *
 * nodesByNodeDef: stores the list of all node uuids ['node-1-uuid', 'node-2-uuid', 'node-5-uuid', 'node-6-uuid', ...]
 *                   for each nodeDef uuid (node-def-1-uuid)
 *   e.g.:
 *   nodesByNodeDef = {
 *     'node-def-1-uuid': ['node-1-uuid', 'node-2-uuid', 'node-5-uuid', 'node-6-uuid', ...]
 *     'node-def-2-uuid': ['node-3-uuid', 'node-4-uuid', 'node-7-uuid', 'node-8-uuid', ...]
 *   }
 *
 * nodeCodeDependents : dependent code attribute uuids by node uuid
 *   e.g.:
 *   nodeCodeDependents = {
 *     'code-attr-1-uuid': ['code-attr-2-uuid', 'code-attr-3-uuid', ...],
 *     'code-attr-4-uuid': ['code-attr-5-uuid', 'code-attr-6-uuid', ...],
 *   }
 */

const keys = {
  nodeRootUuid: '_nodeRootUuid',
  nodesByParentAndDef: '_nodesByParentAndDef',
  nodesByDef: '_nodesByDef',
  nodeCodeDependents: '_nodeCodeDependents',
}

// ==== GETTERS
/**
 * Returns the root node uuid
 */
export const getNodeRootUuid = R.prop(keys.nodeRootUuid)

/**
 * Returns the list of node uuids having the specified nodeDefUuid
 */
export const getNodeUuidsByDef = (nodeDefUuid) => R.pathOr([], [keys.nodesByDef, nodeDefUuid])

/**
 * Returns the list of node uuids having the specified parentNodeUuid and nodeDefUuid
 */
export const getNodeUuidsByParentAndDef = (parentNodeUuid, childDefUuid) =>
  R.pathOr([], [keys.nodesByParentAndDef, parentNodeUuid, childDefUuid])

/**
 * Returns the list of all node uuids having the specified parentNodeUuid
 */
export const getNodeUuidsByParent = (parentNodeUuid) =>
  R.pipe(R.pathOr({}, [keys.nodesByParentAndDef, parentNodeUuid]), R.values, R.flatten)

export const getNodeCodeDependentUuids = (nodeUuid) => R.pathOr([], [keys.nodeCodeDependents, nodeUuid])

// ==== ADD

/**
 * Adds the specified node to the cache.
 * When the node already exists in the cache, avoidDuplicates parameter must be passed as true, otherwise duplicate value will be stored in the cache.
 * The check for duplicates is slow, it must be avoided when you are sure that the node to be added is not already in the cache.
 *
 * @param {!object} node - The node to be added to the cache.
 * @param {boolean} [avoidDuplicates = true] - True if a check on duplicate values must be performed, false otherwise.
 * @returns {object} - The updated record.
 */
const _addNode =
  ({ node, avoidDuplicates = true }) =>
  (record) => {
    const nodeUuid = Node.getUuid(node)
    const nodeDefUuid = Node.getNodeDefUuid(node)
    return R.pipe(
      // RootUuid
      R.when(R.always(Node.isRoot(node)), R.assoc(keys.nodeRootUuid, nodeUuid)),
      // Parent index
      _assocToIndexPath({
        path: [keys.nodesByParentAndDef, Node.getParentUuid(node), nodeDefUuid],
        value: nodeUuid,
        avoidDuplicates,
      }),
      // Node def index
      _assocToIndexPath({ path: [keys.nodesByDef, nodeDefUuid], value: nodeUuid, avoidDuplicates }),
      // Code dependent index
      _addNodeToCodeDependentsIndex({ node, avoidDuplicates })
    )(record)
  }

/**
 * Adds the specified nodes to the cache.
 * Nodes to be added must not be already in the cache (e.g. record nodes have been just fetched from DB).
 *
 * @param {!object} nodes - The nodes to be added to the cache.
 * @returns {object} - The updated record.
 */
export const addNewNodes = (nodes) => (record) => {
  let recordUpdated = { ...record }
  Object.values(nodes).forEach((node) => {
    if (!Node.isDeleted(node)) {
      // nodes should not be already in the cache, do not check for duplicates.
      recordUpdated = _addNode({ node, avoidDuplicates: false })(recordUpdated)
    }
  })
  return recordUpdated
}

export const addOrUpdateNode = (node) => _addNode({ node, avoidDuplicates: true })

const _addNodeToCodeDependentsIndex =
  ({ node, avoidDuplicates = true }) =>
  (record) =>
    R.reduce(
      (recordAcc, ancestorCodeAttributeUuid) =>
        _assocToIndexPath({
          path: [keys.nodeCodeDependents, ancestorCodeAttributeUuid],
          value: Node.getUuid(node),
          avoidDuplicates,
        })(recordAcc),
      record,
      Node.getHierarchyCode(node)
    )

// ===== DELETE
/**
 * Removed the specified node from the cache
 */
export const removeNode = (node) =>
  R.pipe(
    R.ifElse(R.always(Node.isRoot(node)), R.dissoc(keys.nodeRootUuid), R.identity),
    // Parent index
    _dissocFromIndexPath(
      [keys.nodesByParentAndDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)],
      Node.getUuid(node)
    ),
    // Node def index
    _dissocFromIndexPath([keys.nodesByDef, Node.getNodeDefUuid(node)], Node.getUuid(node)),
    // Code dependent index
    _removeNodeFromCodeDependentsIndex(node)
  )

const _removeNodeFromCodeDependentsIndex = (node) => (record) =>
  R.pipe(
    Node.getHierarchyCode,
    R.reduce(
      (recordAcc, ancestorCodeAttributeUuid) =>
        _dissocFromIndexPath([keys.nodeCodeDependents, ancestorCodeAttributeUuid], Node.getUuid(node))(recordAcc),
      record
    ),
    R.dissocPath([keys.nodeCodeDependents, Node.getUuid(node)])
  )(node)

const _updateIndexAtPath =
  ({ path, updateFn }) =>
  (record) => {
    const indexOld = R.pathOr([], path)(record)
    const indexNew = updateFn(indexOld)
    return ObjectUtils.setInPath(path, indexNew)(record)
  }

const _assocToIndexPath = ({ path, value, avoidDuplicates = true }) =>
  _updateIndexAtPath({
    path,
    updateFn: (indexOld) => (avoidDuplicates && indexOld.includes(value) ? indexOld : [...indexOld, value]),
  })

const _dissocFromIndexPath = (path, value) => _updateIndexAtPath({ path, updateFn: R.without(value) })
