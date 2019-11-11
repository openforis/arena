const R = require('ramda')

const ObjectUtils = require('@core/objectUtils')
const { uuidv4 } = require('@core/uuid')

const Validation = require('@core/validation/validation')
const User = require('@core/user/user')
const RecordStep = require('./recordStep')

const keys = require('./_record/recordKeys')
const RecordReader = require('./_record/recordReader')
const RecordUpdater = require('./_record/recordUpdater')

// ====== CREATE

const newRecord = (user, cycle, preview = false, dateCreated = null, step = null) => ({
  [keys.uuid]: uuidv4(),
  [keys.ownerUuid]: User.getUuid(user),
  [keys.step]: step || RecordStep.getDefaultStep(),
  [keys.cycle]: cycle,
  [keys.preview]: preview,
  [keys.dateCreated]: dateCreated,
})

module.exports = {
  keys,

  // ====== CREATE
  newRecord,

  // ====== READ
  getSurveyUuid: R.prop(keys.surveyUuid),

  getUuid: ObjectUtils.getUuid,
  isPreview: R.propEq(keys.preview, true),
  getOwnerUuid: R.prop(keys.ownerUuid),
  getOwnerName: R.prop(keys.ownerName),
  getStep: R.prop(keys.step),
  getCycle: R.prop(keys.cycle),
  getDateCreated: ObjectUtils.getDateCreated,
  getDateModified: ObjectUtils.getDateModified,

  getNodes: RecordReader.getNodes,
  getNodeByUuid: RecordReader.getNodeByUuid,
  getRootNode: RecordReader.getRootNode,
  getNodesByDefUuid: RecordReader.getNodesByDefUuid,

  // ==== hierarchy
  getParentNode: RecordReader.getParentNode,
  getAncestorsAndSelf: RecordReader.getAncestorsAndSelf,
  getAncestorByNodeDefUuid: RecordReader.getAncestorByNodeDefUuid,

  getNodeChildren: RecordReader.getNodeChildren,
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
  mergeNodes: RecordUpdater.mergeNodes,

  // ====== DELETE
  deleteNode: RecordUpdater.deleteNode,

  // ====== VALIDATION
  mergeNodeValidations: RecordUpdater.mergeNodeValidations,
  getValidation: Validation.getValidation,
}
