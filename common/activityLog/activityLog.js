import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

export const type = {
  // Survey
  surveyCreate: 'surveyCreate',
  surveyPropUpdate: 'surveyPropUpdate',
  surveyPublish: 'surveyPublish',
  surveyCollectImport: 'surveyCollectImport',

  // NodeDef
  nodeDefCreate: 'nodeDefCreate',
  nodeDefUpdate: 'nodeDefUpdate',
  nodeDefMarkDeleted: 'nodeDefMarkDeleted',

  // Category
  categoryInsert: 'categoryInsert',
  categoryPropUpdate: 'categoryPropUpdate',
  categoryDelete: 'categoryDelete',
  categoryLevelInsert: 'categoryLevelInsert',
  categoryLevelPropUpdate: 'categoryLevelPropUpdate',
  categoryLevelDelete: 'categoryLevelDelete',
  categoryLevelsDelete: 'categoryLevelsDelete', // System
  categoryItemInsert: 'categoryItemInsert',
  categoryItemPropUpdate: 'categoryItemPropUpdate',
  categoryItemDelete: 'categoryItemDelete',
  categoryImport: 'categoryImport',

  // Taxonomy
  taxonomyCreate: 'taxonomyCreate',
  taxonomyPropUpdate: 'taxonomyPropUpdate',
  taxonomyDelete: 'taxonomyDelete',
  taxonomyTaxaDelete: 'taxonomyTaxaDelete', // System
  taxonomyTaxaImport: 'taxonomyTaxaImport',
  taxonInsert: 'taxonInsert', // System
  taxonUpdate: 'taxonUpdate', // System

  // record
  recordCreate: 'recordCreate',
  recordDelete: 'recordDelete',
  recordStepUpdate: 'recordStepUpdate',

  // Node
  nodeCreate: 'nodeCreate',
  nodeValueUpdate: 'nodeValueUpdate',
  nodeDelete: 'nodeDelete',

  // User
  userInvite: 'userInvite',
  userUpdate: 'userUpdate',
  userRemove: 'userRemove',

  // Analysis
  processingChainCreate: 'processingChainCreate',
  processingChainPropUpdate: 'processingChainPropUpdate',
  processingChainDelete: 'processingChainDelete',
  processingStepCreate: 'processingStepCreate',
  processingStepPropsUpdate: 'processingStepPropsUpdate',
  processingStepDelete: 'processingStepDelete',
  processingStepCalculationCreate: 'processingStepCalculationCreate',
  processingStepCalculationIndexUpdate: 'processingStepCalculationIndexUpdate',
}

export const keys = {
  content: 'content',
  dateCreated: ObjectUtils.keys.dateCreated,
  type: 'type',
  system: 'system',
  userUuid: 'userUuid',

  // Props associated from fetch
  userName: 'userName',
  recordUuid: 'recordUuid',
  keysHierarchy: 'keysHierarchy',
  nodeDefUuid: 'nodeDefUuid',
  // User
  targetUserName: 'targetUserName',
  targetUserEmail: 'targetUserEmail',
  targetUserUuid: 'targetUserUuid',
  // Analysis
  processingChainLabels: 'processingChainLabels',
  processingStepIndex: 'processingStepIndex',
  processingStepCalculationIndex: 'processingStepCalculationIndex',
}

export const keysContent = {
  uuid: ObjectUtils.keys.uuid,
  parentUuid: ObjectUtils.keys.parentUuid,
  name: ObjectUtils.keys.name,
  key: 'key',
  value: 'value',
  // Category
  categoryName: 'categoryName',
  categoryUuid: 'categoryUuid',
  index: 'index',
  code: 'code',
  levelUuid: 'levelUuid',
  // Taxonomy
  taxonomyName: 'taxonomyName',
  // Record
  keys: 'keys',
  stepFrom: 'stepFrom',
  stepTo: 'stepTo',
  // Node
  nodeDefUuid: 'nodeDefUuid',
  recordUuid: 'recordUuid',
  // User
  groupUuid: 'groupUuid',
  // Analysis
  labels: 'labels',
  processingChainUuid: 'processingChainUuid',
  processingStepUuid: 'processingStepUuid',
  indexFrom: 'indexFrom',
  indexTo: 'indexTo',
}

// ====== CREATE
export const newActivity = (type, content, system = false) => ({
  [keys.type]: type,
  [keys.content]: content,
  [keys.system]: system,
})

// ====== READ

export const getId = ObjectUtils.getId
export const getUserUuid = R.prop(keys.userUuid)
export const getType = R.prop(keys.type)
export const getContent = R.prop(keys.content)
export const isSystem = R.propEq(keys.system, true)
export const getDateCreated = ObjectUtils.getDateCreated

// Props associated from fetch
export const getUserName = R.prop(keys.userName)
export const getRecordUuid = R.prop(keys.recordUuid)
export const getKeysHierarchy = R.propOr([], keys.keysHierarchy)
export const getNodeDefUuid = R.prop(keys.nodeDefUuid)
export const getTargetUserName = R.prop(keys.targetUserName)
export const getTargetUserUuid = R.prop(keys.targetUserUuid)
export const getTargetUserEmail = R.prop(keys.targetUserEmail)
export const getProcessingChainLabels = R.prop(keys.processingChainLabels)
export const getProcessingStepIndex = R.prop(keys.processingStepIndex)
export const getProcessingStepCalculationIndex = R.prop(keys.processingStepCalculationIndex)

// Content props
const _getContentProp = prop => R.path([keys.content, prop])
export const getContentUuid = _getContentProp(keysContent.uuid)
export const getContentParentUuid = _getContentProp(keysContent.parentUuid)
export const getContentName = _getContentProp(keysContent.name)
export const getContentKey = _getContentProp(keysContent.key)
// Content props category
export const getContentCategoryName = _getContentProp(keysContent.categoryName)
export const getContentCategoryUuid = _getContentProp(keysContent.categoryUuid)
export const getContentIndex = _getContentProp(keysContent.index)
export const getContentCode = _getContentProp(keysContent.code)
export const getContentLevelUuid = _getContentProp(keysContent.levelUuid)
// Content props taxonomy
export const getContentTaxonomyName = _getContentProp(keysContent.taxonomyName)
// Content props record
export const getContentKeys = _getContentProp(keysContent.keys)
export const getContentStepFrom = _getContentProp(keysContent.stepFrom)
export const getContentStepTo = _getContentProp(keysContent.stepTo)
export const getContentNodeDefUuid = _getContentProp(keysContent.nodeDefUuid)
export const getContentRecordUuid = _getContentProp(keysContent.recordUuid)
// Content props user
export const getContentGroupUuid = _getContentProp(keysContent.groupUuid)
// Content props analysis
export const getContentLabels = _getContentProp(keysContent.labels)
export const getContentIndexFrom = _getContentProp(keysContent.indexFrom)
export const getContentIndexTo = _getContentProp(keysContent.indexTo)
