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
 *
 * nodesDirty: uuids of nodes being updated (modified in the UI but not on server side)
 *   e.g.:
 *   nodesDirty = ['node-1-uuid', 'node-2-uuid', ...]
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
  nodesDirty: '_nodesDirty',
  nodeCodeDependents: '_nodeCodeDependents'
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

const getNodeUuidsDirty = R.propOr([], keys.nodesDirty)

const getNodeCodeDependentUuids = nodeUuid => R.pathOr([], [keys.nodeCodeDependents, nodeUuid])

// ==== ADD
/**
 * Adds the specified nodes to the cache
 */
const addNodes = nodes =>
  record =>
    R.pipe(
      R.values,
      R.reduce(
        (recordAcc, node) =>
          R.ifElse(
            R.always(Node.isDeleted(node)),
            R.identity,
            _addNode(node)
          )(recordAcc),
        record
      )
    )(nodes)

const _addNode = node => R.pipe(
  //rootUuid
  R.ifElse(
    R.always(Node.isRoot(node)),
    R.assoc(keys.nodeRootUuid, Node.getUuid(node)),
    R.identity,
  ),
  //parent index
  addOrDeleteElementInArrayInPath([keys.nodesByParentAndDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)], Node.getUuid(node)),
  //node def index
  addOrDeleteElementInArrayInPath([keys.nodesByDef, Node.getNodeDefUuid(node)], Node.getUuid(node)),
  //code dependent index
  _addNodeToCodeDependentsIndex(node),
  //dirty index
  addOrDeleteElementInArrayInPath([keys.nodesDirty], Node.getUuid(node), Node.isDirty(node))
)

const _addNodeToCodeDependentsIndex = node => record =>
  R.reduce(
    (recordAcc, ancestorCodeAttributeUuid) =>
      addOrDeleteElementInArrayInPath([keys.nodeCodeDependents, ancestorCodeAttributeUuid], Node.getUuid(node))(recordAcc),
    record,
    Node.getCodeAttributeHierarchy(node)
  )

// ===== DELETE
/**
 * Removed the specified node from the cache
 */
const removeNode = node => R.pipe(
  R.ifElse(
    R.always(Node.isRoot(node)),
    R.dissoc(keys.nodeRootUuid),
    R.identity
  ),
  //parent index
  addOrDeleteElementInArrayInPath([keys.nodesByParentAndDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)], Node.getUuid(node), false),
  //node def index
  addOrDeleteElementInArrayInPath([keys.nodesByDef, Node.getNodeDefUuid(node)], Node.getUuid(node), false),
  //code dependent index
  _removeNodeFromCodeDependentsIndex(node),
  //dirty index
  addOrDeleteElementInArrayInPath([keys.nodesDirty], Node.getUuid(node), false)
)

const _removeNodeFromCodeDependentsIndex = node => record => R.pipe(
  Node.getCodeAttributeHierarchy,
  R.reduce(
    (recordAcc, ancestorCodeAttributeUuid) =>
      addOrDeleteElementInArrayInPath([keys.nodeCodeDependents, ancestorCodeAttributeUuid], Node.getUuid(node), false)(recordAcc),
    record,
  ),
  R.dissocPath([keys.nodeCodeDependents, Node.getUuid(node)])
)(node)

const addOrDeleteElementInArrayInPath = (path, value, add = true) => obj => R.pipe(
  R.pathOr([], path),
  R.ifElse(
    R.always(add),
    R.ifElse(
      R.includes(value),
      R.identity,
      R.append(value)
    ),
    R.without(value)
  ),
  arr => R.assocPath(path, arr, obj)
)(obj)

module.exports = {
  //ADD
  addNodes,
  //GETTERS
  getNodeRootUuid,
  getNodeUuidsByParent,
  getNodeUuidsByParentAndDef,
  getNodeUuidsByDef,
  getNodeUuidsDirty,
  getNodeCodeDependentUuids,
  //REMOVE
  removeNode
}