/**
 * This repository is only meant to be used for record preview.
 * It keeps a list of record nodes in memory instead of serializing them in the db.
 */

const Node = require('../../../../common/record/node')
const R = require('ramda')

// ============== CREATE

const nodes = {
  'root': {
    meta: {h: []},
    parentUuid: null,
    recordUuid: 'preview',
    uuid: 'root',
    value: null,
  }
}

const insertNode = async (surveyId, node) => {
  const parentUuid = Node.getParentUuid(node)

  const meta = {
    h: parentUuid && parentUuid !== 'preview'
      ? R.append(nodes[parentUuid].id, nodes[parentUuid].meta)
      : []
  }

  const newNode = R.pipe(
    R.assoc('parentUuid', parentUuid),
    R.assoc('nodeDefUuid', Node.getNodeDefUuid(node)),
    R.assoc('meta', meta),
  )(node)

  nodes[node.uuid] = newNode

  return R.clone(newNode)
}

// ============== READ

const fetchNodesByRecordUuid = () => R.clone(nodes)

const fetchNodeByUuid = (surveyId, uuid) => R.prop(uuid, nodes)

const fetchDescendantNodesByCodeUuid = (surveyId, recordUuid, parentCodeNodeUuid) =>
  R.pipe(
    R.filter(n => R.equals(n.value.h, [parentCodeNodeUuid])),
    R.sortBy(n => n.id),
  )(nodes)

// ============== UPDATE

const updateNode = (surveyId, nodeUuid, value) => {
  const updatedNode = R.assoc('value', value)(nodes[nodeUuid])
  nodes[nodeUuid] = updatedNode

  return R.assoc('updated', true)(updatedNode)
}

// ============== DELETE

const deleteNode = (surveyId, nodeUuid) => {
  const node = nodes[nodeUuid]
  delete nodes[nodeUuid]

  return node.assoc('deleted', true)
}

module.exports = {
  //CREATE
  insertNode,

  //READ
  fetchNodesByRecordUuid,
  fetchNodeByUuid,
  fetchDescendantNodesByCodeUuid,

  //UPDATE
  updateNode,

  //DELETE
  deleteNode,
}
