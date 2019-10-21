import * as R from 'ramda';
import Node from '../node';
import ObjectUtils from '../../objectUtils';
import { IRecord } from '../../../test/it/utils/recordBuilder';

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
  nodeCodeDependents: '_nodeCodeDependents'
}

// ==== GETTERS
/**
 * Returns the root node uuid
 */
const getNodeRootUuid: (x: any) => string = R.prop(keys.nodeRootUuid)

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

const getNodeCodeDependentUuids = nodeUuid => R.pathOr([], [keys.nodeCodeDependents, nodeUuid])

// ==== ADD
/**
 * Adds the specified nodes to the cache
 */
const addNodes:  <T>(nodes: T[]) => (record: IRecord) => any = <T>(nodes: T[]) => record =>
  R.pipe(
    R.values as (x: any) => T[],
    R.reject(Node.isDeleted) as (x: T[]) => T[],
    R.reduce(
      (recordAcc, node) => addNode(node)(recordAcc),
      record
    )
  )(nodes)

const addNode = node => R.pipe(
  //rootUuid
  R.ifElse(
    R.always(Node.isRoot(node)),
    R.assoc(keys.nodeRootUuid, Node.getUuid(node)),
    R.identity,
  ),
  //parent index
  _assocToIndexPath([keys.nodesByParentAndDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)], Node.getUuid(node)),
  //node def index
  _assocToIndexPath([keys.nodesByDef, Node.getNodeDefUuid(node)], Node.getUuid(node)),
  //code dependent index
  _addNodeToCodeDependentsIndex(node),
)

const _addNodeToCodeDependentsIndex = node => record =>
  R.reduce(
    (recordAcc, ancestorCodeAttributeUuid) =>
      _assocToIndexPath([keys.nodeCodeDependents, ancestorCodeAttributeUuid], Node.getUuid(node))(recordAcc),
    record,
    Node.getHierarchyCode(node)
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
  _dissocFromIndexPath([keys.nodesByParentAndDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)], Node.getUuid(node)),
  //node def index
  _dissocFromIndexPath([keys.nodesByDef, Node.getNodeDefUuid(node)], Node.getUuid(node)),
  //code dependent index
  _removeNodeFromCodeDependentsIndex(node),
)

const _removeNodeFromCodeDependentsIndex = node => record => R.pipe(
  Node.getHierarchyCode,
  R.reduce(
    (recordAcc, ancestorCodeAttributeUuid) =>
      _dissocFromIndexPath([keys.nodeCodeDependents, ancestorCodeAttributeUuid], Node.getUuid(node))(recordAcc),
    record,
  ),
  R.dissocPath([keys.nodeCodeDependents, Node.getUuid(node)])
)(node)

const _assocToIndexPath = (path, value) => record => R.pipe(
  R.pathOr([], path),
  R.ifElse(
    R.includes(value),
    R.identity,
    R.append(value)
  ),
  valuesArray => ObjectUtils.setInPath(path, valuesArray)(record)
)(record)

const _dissocFromIndexPath = (path, value) => record => R.pipe(
  R.pathOr([], path),
  R.without(value),
  valuesArray => ObjectUtils.setInPath(path, valuesArray)(record)
)(record)

export default {
  //ADD
  addNodes,
  addNode,
  //GETTERS
  getNodeRootUuid,
  getNodeUuidsByParent,
  getNodeUuidsByParentAndDef,
  getNodeUuidsByDef,
  getNodeCodeDependentUuids,
  //REMOVE
  removeNode
};
