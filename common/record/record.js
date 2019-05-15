const R = require('ramda')
const { uuidv4 } = require('./../uuid')

const SurveyUtils = require('../survey/surveyUtils')
const Validator = require('../validation/validator')
const User = require('../user/user')
const RecordStep = require('./recordStep')

const keys = require('./_internal/recordKeys')
const RecordReader = require('./_internal/recordReader')
const RecordUpdater = require('./_internal/recordUpdater')

// ====== CREATE

const newRecord = (user, preview = false) => ({
  [keys.uuid]: uuidv4(),
  [keys.ownerId]: User.getId(user),
  [keys.step]: RecordStep.getDefaultStep(),
  [keys.preview]: preview
})

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
  getNodeByUuid: RecordReader.getNodeByUuid,
  getRootNode: RecordReader.getRootNode,
  getNodesByDefUuid: RecordReader.getNodesByDefUuid,

  // ==== hierarchy
  getParentNode: RecordReader.getParentNode,
  getAncestorsAndSelf: RecordReader.getAncestorsAndSelf,
  getAncestorByNodeDefUuid: RecordReader.getAncestorByNodeDefUuid,

  getNodeSiblingsByDefUuid: RecordReader.getNodeSiblingsByDefUuid,
  getNodeChildrenByDefUuid: RecordReader.getNodeChildrenByDefUuid,
  getNodeChildByDefUuid: RecordReader.getNodeChildByDefUuid,

  // ==== dependency
  getDependentNodes: RecordReader.getDependentNodes,
  getParentCodeAttribute: RecordReader.getParentCodeAttribute,
  getDependentCodeAttributes: RecordReader.getDependentCodeAttributes,

  // ====== UPDATE
  assocNodes: RecordUpdater.assocNodes,
  assocNode: RecordUpdater.assocNode,

  // ====== DELETE

  deleteNode: RecordUpdater.deleteNode,

  // ====== VALIDATION
  mergeNodeValidations: Validator.mergeValidation,
  getValidation: Validator.getValidation,
}