const R = require('ramda')

const Node = require('../record/node')

const keys = {
  nodesByParentAndChildDef: 'nodesByParentAndChildDef',
  nodesByNodeDef: 'nodesByNodeDef',
}

const getNodeUuidsByNodeDef = nodeDefUuid => R.pathOr([], [keys.nodesByNodeDef, nodeDefUuid])

const getNodeChildrenUuidsByParentAndChildDef = (parentNodeUuid, childDefUuid) => R.pathOr([], [keys.nodesByParentAndChildDef, parentNodeUuid, childDefUuid])

const getNodeChildrenUuidsByParent = parentNodeUuid => R.pipe(
  R.pathOr({}, [keys.nodesByParentAndChildDef, parentNodeUuid]),
  R.values,
  R.flatten
)

const indexNodeByNodeDef = node => record => R.pipe(
  getNodeUuidsByNodeDef(Node.getNodeDefUuid(node)),
  R.ifElse(
    R.includes(Node.getUuid(node)),
    R.identity,
    R.append(Node.getUuid(node))
  ),
  arr => R.assocPath([keys.nodesByNodeDef, Node.getNodeDefUuid(node)], arr, record)
)(record)

const indexNodeByParent = node => record => R.pipe(
  getNodeChildrenUuidsByParentAndChildDef(Node.getParentUuid(node), Node.getNodeDefUuid(node)),
  R.ifElse(
    R.includes(Node.getUuid(node)),
    R.identity,
    R.append(Node.getUuid(node))
  ),
  arr => R.assocPath([keys.nodesByParentAndChildDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)], arr, record)
)(record)

const indexNode = node => R.pipe(
  indexNodeByParent(node),
  indexNodeByNodeDef(node)
)

const indexNodes = nodes =>
  record =>
    R.pipe(
      R.values,
      R.reduce(
        (acc, node) => Node.isDeleted(node)
          ? acc
          : indexNode(node)(acc),
        record
      )
    )(nodes)

const removeNodeFromIndexByParent = node => record => R.pipe(
  getNodeChildrenUuidsByParentAndChildDef(Node.getParentUuid(node), Node.getNodeDefUuid(node)),
  R.without([Node.getUuid(node)]),
  arr => R.assocPath([keys.nodesByParentAndChildDef, Node.getParentUuid(node), Node.getNodeDefUuid(node)], arr)(record)
)(record)

const removeNodeFromIndexByNodeDef = node => record => R.pipe(
  getNodeUuidsByNodeDef(Node.getNodeDefUuid(node)),
  R.without([Node.getUuid(node)]),
  arr => R.assocPath([keys.nodesByNodeDef, Node.getNodeDefUuid(node)], arr)(record)
)(record)

const removeNodeFromIndex = node => R.pipe(
  removeNodeFromIndexByParent(node),
  removeNodeFromIndexByNodeDef(node)
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