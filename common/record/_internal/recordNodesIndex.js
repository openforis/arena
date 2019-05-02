const R = require('ramda')

const Node = require('../node')

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
 */

const keys = {
  nodeRootUuid: '_nodeRootUuid',
  nodesByParentAndDef: '_nodesByParentAndDef',
  nodesByDef: '_nodesByDef',
}

// ==== GETTERS
/**
 * Returns the root node uuid
 */
const getNodeRootUuid = R.prop(keys.nodeRootUuid)

/**
 * Returns the list of node uuids having the specified nodeDefUuid
 */
const getNodeUuidsByDef = nodeDefUuid => R.pathOr([], [keys.nodesByDef, nodeDefUuid])

/**
 * Returns the list of node uuids having the specified parentNodeUuid and nodeDefUuid
 */
const getNodeUuidsByParentAndDef = (parentNodeUuid, childDefUuid) => R.pathOr([], [keys.nodesByParentAndDef, parentNodeUuid, childDefUuid])

/**
 * Returns the list of all node uuids having the specified parentNodeUuid
 */
const getNodeUuidsByParent = parentNodeUuid => R.pipe(
  R.pathOr({}, [keys.nodesByParentAndDef, parentNodeUuid]),
  R.values,
  R.flatten
)

// ==== ADD
/**
 * Adds the specified nodes to the cache
 */
const addNodes = nodes =>
  record =>
    R.pipe(
      R.values,
      R.reduce(
        (acc, node) => Node.isDeleted(node)
          ? acc
          : _addNode(node)(acc),
        record
      )
    )(nodes)

const _addNode = node => R.pipe(
  record => Node.isRoot(node) ? R.assoc(keys.nodeRootUuid, Node.getUuid(node))(record) : record,
  _addNodeToParentIndex(node),
  _addNodeToNodeDefIndex(node)
)

const _addNodeToNodeDefIndex = node => record => R.pipe(
  getNodeUuidsByDef(Node.getNodeDefUuid(node)),
  R.ifElse(
    R.includes(Node.getUuid(node)),
    R.identity,
    R.append(Node.getUuid(node))
  ),
  arr => R.assocPath([keys.nodesByDef, Node.getNodeDefUuid(node)], arr, record)
)(record)

const _addNodeToParentIndex = node => record => R.pipe(
  getNodeUuidsByParentAndDef(Node.getParentUuid(node), Node.getNodeDefUuid(node)),
  R.ifElse(
    R.includes(Node.getUuid(node)),
    R.identity,
    R.append(Node.getUuid(node))
  ),
  arr => R.assocPath([keys.nodesByParentAndDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)], arr, record)
)(record)

// ===== DELETE
/**
 * Removed the specified node from the cache
 */
const removeNode = node => R.pipe(
  _removeNodeFromParentIndex(node),
  _removeNodeFromNodeDefIndex(node)
)

const _removeNodeFromParentIndex = node => record => R.pipe(
  getNodeUuidsByParentAndDef(Node.getParentUuid(node), Node.getNodeDefUuid(node)),
  R.without([Node.getUuid(node)]),
  arr => R.assocPath([keys.nodesByParentAndDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)], arr)(record)
)(record)

const _removeNodeFromNodeDefIndex = node => record => R.pipe(
  getNodeUuidsByDef(Node.getNodeDefUuid(node)),
  R.without([Node.getUuid(node)]),
  arr => R.assocPath([keys.nodesByDef, Node.getNodeDefUuid(node)], arr)(record)
)(record)


module.exports = {
  //ADD
  addNodes,
  //GETTERS
  getNodeRootUuid,
  getNodeUuidsByParent,
  getNodeUuidsByParentAndDef,
  getNodeUuidsByDef,
  //REMOVE
  removeNode
}