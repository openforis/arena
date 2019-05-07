const R = require('ramda')
const { uuidv4 } = require('./../uuid')

const SurveyUtils = require('../survey/surveyUtils')
const Validator = require('../validation/validator')
const Node = require('./node')
const User = require('../user/user')
const RecordStep = require('./recordStep')

const keys = require('./_internal/recordKeys')
const NodesIndex = require('./_internal/recordNodesIndex')
const RecordReader = require('./_internal/recordReader')

// ====== CREATE

const newRecord = (user, preview = false) => ({
  [keys.uuid]: uuidv4(),
  [keys.ownerId]: User.getId(user),
  [keys.step]: RecordStep.getDefaultStep(),
  [keys.preview]: preview
})

// ====== UPDATE

const assocNodes = nodes =>
  record => {
    // exclude dirty nodes currently being edited by the user

    const dirtyNodes = RecordReader.findNodesIndexed(Node.isDirty)(record)

    const nodesToUpdate = R.pipe(
      R.filter(
        n => {
          const dirtyNode = R.prop(Node.getUuid(n), dirtyNodes)
          return !dirtyNode ||
            Node.isDirty(n) ||
            R.equals(Node.getValue(dirtyNode), Node.getValue(n)) ||
            Node.isValueBlank(dirtyNode) && Node.isDefaultValueApplied(n)
        }),
      R.map(
        R.omit([Node.keys.updated, Node.keys.created])
      )
    )(nodes)

    const nodesDeletedArray = R.pipe(
      R.filter(Node.isDeleted),
      R.values
    )(nodes)

    return R.pipe(
      RecordReader.getNodes,
      R.mergeLeft(nodesToUpdate),
      mergedNodes => R.assoc(keys.nodes, mergedNodes)(record),
      deleteNodes(nodesDeletedArray),
      NodesIndex.addNodes(nodesToUpdate)
    )(record)
  }

const deleteNodes = nodesDeletedArray =>
  record => R.reduce(
    (updatedRecord, node) => deleteNode(node)(updatedRecord),
    record,
    nodesDeletedArray
  )

// ====== DELETE
const deleteNode = node =>
  record => {
    const nodeUuid = Node.getUuid(node)

    // 1. remove entity children recursively
    const children = RecordReader.getNodeChildren(node)(record)

    let recordUpdated = R.reduce(
      (recordAcc, child) => deleteNode(child)(recordAcc),
      record,
      children
    )

    // 2. update validation
    recordUpdated = R.pipe(
      Validator.getValidation,
      Validator.dissocFieldValidation(nodeUuid),
      newValidation => Validator.assocValidation(newValidation)(recordUpdated)
    )(recordUpdated)

    // 3. remove node from index
    recordUpdated = NodesIndex.removeNode(node)(recordUpdated)

    // 4. remove node from record
    recordUpdated = R.pipe(
      RecordReader.getNodes,
      R.dissoc(nodeUuid),
      newNodes => R.assoc(keys.nodes, newNodes, recordUpdated),
    )(recordUpdated)

    return recordUpdated
  }

module.exports = {
  keys,

  // ====== CREATE
  newRecord,

  // ====== READ
  getUuid: SurveyUtils.getUuid,
  isPreview: R.propEq(keys.preview, true),
  getOwnerId: R.prop(keys.ownerId),
  getStep: R.prop(keys.step),

  getNodes: RecordReader.getNodes,
  getNodesArray: RecordReader.getNodesArray,
  getNodeByUuid: RecordReader.getNodeByUuid,
  getRootNode: RecordReader.getRootNode,
  getNodesByDefUuid: RecordReader.getNodesByDefUuid,


  // ==== hierarchy
  getParentNode: RecordReader.getParentNode,
  getAncestorsAndSelf: RecordReader.getAncestorsAndSelf,
  getAncestorByNodeDefUuid: RecordReader.getAncestorByNodeDefUuid,

  getNodeSiblingsByDefUuid:RecordReader.getNodeSiblingsByDefUuid,
  getNodeChildrenByDefUuid:RecordReader.getNodeChildrenByDefUuid,
  getNodeChildByDefUuid: RecordReader.getNodeChildByDefUuid,

  // ==== dependency
  getDependentNodes: RecordReader.getDependentNodes,
  getCodeUuidsHierarchy: RecordReader.getCodeUuidsHierarchy,
  getParentCodeAttribute: RecordReader.getParentCodeAttribute,
  getDependentCodeAttributes: RecordReader.getDependentCodeAttributes,

  // ====== UPDATE
  assocNodes,
  assocNode: node => assocNodes({ [Node.getUuid(node)]: node }),
  mergeNodeValidations: Validator.mergeValidation,

  // ====== DELETE

  deleteNode,

  // ====== VALIDATION
  getValidation: Validator.getValidation,
}