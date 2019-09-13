const R = require('ramda')
const { uuidv4 } = require('./../uuid')

const SurveyUtils = require('../survey/surveyUtils')
const Validator = require('../validation/validator')
const User = require('../user/user')
const RecordStep = require('./recordStep')

const keys = require('./_record/recordKeys')
const RecordReader = require('./_record/recordReader')
const RecordUpdater = require('./_record/recordUpdater')

// ====== CREATE

const newRecord = (user, preview = false, dateCreated = null) => ({
  [keys.uuid]: uuidv4(),
  [keys.ownerUuid]: User.getUuid(user),
  [keys.step]: RecordStep.getDefaultStep(),
  [keys.preview]: preview,
  [keys.dateCreated]: dateCreated,
})

module.exports = {
  keys,

  // ====== CREATE
  newRecord,

  // ====== READ
  getSurveyUuid: R.prop(keys.surveyUuid),

  getUuid: SurveyUtils.getUuid,
  isPreview: R.propEq(keys.preview, true),
  getOwnerUuid: R.prop(keys.ownerUuid),
  getOwnerName: R.prop(keys.ownerName),
  getStep: R.prop(keys.step),
  getDateCreated: R.prop(keys.dateCreated),
  getDateModified: R.prop(keys.dateModified),

  getNodes: RecordReader.getNodes,
  getNodeByUuid: RecordReader.getNodeByUuid,
  getRootNode: RecordReader.getRootNode,
  getNodesByDefUuid: RecordReader.getNodesByDefUuid,

  // ==== hierarchy
  getParentNode: RecordReader.getParentNode,
  getAncestorsAndSelf: RecordReader.getAncestorsAndSelf,
  getAncestorByNodeDefUuid: RecordReader.getAncestorByNodeDefUuid,

  getNodeSiblingsAndSelf: RecordReader.getNodeSiblingsAndSelf,
  getNodeChildrenByDefUuid: RecordReader.getNodeChildrenByDefUuid,
  getNodeChildByDefUuid: RecordReader.getNodeChildByDefUuid,
  visitDescendantsAndSelf: RecordReader.visitDescendantsAndSelf,
  isNodeApplicable: RecordReader.isNodeApplicable,

  // ==== dependency
  getDependentNodePointers: RecordReader.getDependentNodePointers,
  getParentCodeAttribute: RecordReader.getParentCodeAttribute,
  getDependentCodeAttributes: RecordReader.getDependentCodeAttributes,

  // ====== Keys
  getEntityKeyNodes: RecordReader.getEntityKeyNodes,
  getEntityKeyValues: RecordReader.getEntityKeyValues,

  // ====== UPDATE
  assocNodes: RecordUpdater.assocNodes,
  assocNode: RecordUpdater.assocNode,

  // ====== DELETE

  deleteNode: RecordUpdater.deleteNode,

  // ====== VALIDATION
  mergeNodeValidations: RecordUpdater.mergeNodeValidations,
  getValidation: Validator.getValidation,
}
