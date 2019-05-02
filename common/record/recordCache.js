const R = require('ramda')

const Node = require('../record/node')

/**
 * Record nodes cache.
 *
 * Cache items:
 *
 * - nodesByParentAndChildDef: stores the list of child node uuids for each child node def uuid for each node uuid
 *   e.g.:
 *   nodesByParentAndChildDef = {
 *     'parent-node-1-uuid': {
 *       'child-def-1-uuid': ['child-node-1-uuid', 'child-node-2-uuid', ...]
 *       'child-def-2-uuid': ['child-node-3-uuid', 'child-node-4-uuid', ...]
 *     },
 *     'parent-node-2-uuid': {
 *       'child-def-1-uuid': ['child-node-5-uuid', 'child-node-6-uuid', ...]
 *       'child-def-2-uuid': ['child-node-7-uuid', 'child-node-8-uuid', ...]
 *     }
 *   }
 *
 * - nodesByNodeDef: stores the list of all node uuids for each nodeDef uuid
 *   e.g.:
 *   nodesByNodeDef = {
 *     'child-def-1-uuid': ['child-node-1-uuid', 'child-node-2-uuid', 'child-node-5-uuid', 'child-node-6-uuid', ...]
 *     'child-def-2-uuid': ['child-node-3-uuid', 'child-node-4-uuid', 'child-node-7-uuid', 'child-node-8-uuid', ...]
 *   }
 */

const keys = {
  nodesByParentAndChildDef: 'nodesByParentAndChildDef',
  nodesByNodeDef: 'nodesByNodeDef',
}

/**
 * Returns the list of node uuids having the specified nodeDefUuid
 */
const getNodeUuidsByNodeDef = nodeDefUuid => R.pathOr([], [keys.nodesByNodeDef, nodeDefUuid])

/**
 * Returns the list of node uuids having the specified parentNodeUuid and nodeDefUuid
 */
const getNodeChildrenUuidsByParentAndChildDef = (parentNodeUuid, childDefUuid) => R.pathOr([], [keys.nodesByParentAndChildDef, parentNodeUuid, childDefUuid])

/**
 * Returns the list of all node uuids having the specified parentNodeUuid
 */
const getNodeChildrenUuidsByParent = parentNodeUuid => R.pipe(
  R.pathOr({}, [keys.nodesByParentAndChildDef, parentNodeUuid]),
  R.values,
  R.flatten
)

const _indexNodeByNodeDef = node => record => R.pipe(
  getNodeUuidsByNodeDef(Node.getNodeDefUuid(node)),
  R.ifElse(
    R.includes(Node.getUuid(node)),
    R.identity,
    R.append(Node.getUuid(node))
  ),
  arr => R.assocPath([keys.nodesByNodeDef, Node.getNodeDefUuid(node)], arr, record)
)(record)

const _indexNodeByParent = node => record => R.pipe(
  getNodeChildrenUuidsByParentAndChildDef(Node.getParentUuid(node), Node.getNodeDefUuid(node)),
  R.ifElse(
    R.includes(Node.getUuid(node)),
    R.identity,
    R.append(Node.getUuid(node))
  ),
  arr => R.assocPath([keys.nodesByParentAndChildDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)], arr, record)
)(record)

const _indexNode = node => R.pipe(
  _indexNodeByParent(node),
  _indexNodeByNodeDef(node)
)

/**
 * Adds the specified nodes to the cache
 */
const indexNodes = nodes =>
  record =>
    R.pipe(
      R.values,
      R.reduce(
        (acc, node) => Node.isDeleted(node)
          ? acc
          : _indexNode(node)(acc),
        record
      )
    )(nodes)

const _removeNodeFromIndexByParent = node => record => R.pipe(
  getNodeChildrenUuidsByParentAndChildDef(Node.getParentUuid(node), Node.getNodeDefUuid(node)),
  R.without([Node.getUuid(node)]),
  arr => R.assocPath([keys.nodesByParentAndChildDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)], arr)(record)
)(record)

const _removeNodeFromIndexByNodeDef = node => record => R.pipe(
  getNodeUuidsByNodeDef(Node.getNodeDefUuid(node)),
  R.without([Node.getUuid(node)]),
  arr => R.assocPath([keys.nodesByNodeDef, Node.getNodeDefUuid(node)], arr)(record)
)(record)

/**
 * Removed the specified node from the cache
 */
const removeNodeFromIndex = node => R.pipe(
  _removeNodeFromIndexByParent(node),
  _removeNodeFromIndexByNodeDef(node)
)

module.exports = {
  //CREATE
  indexNodes,
  //READ
  getNodeChildrenUuidsByParent,
  getNodeChildrenUuidsByParentAndChildDef,
  getNodeUuidsByNodeDef,
  //DELETE
  removeNodeFromIndex
}