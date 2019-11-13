import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

export const type = {
  //survey
  surveyCreate: 'surveyCreate',
  surveyPropUpdate: 'surveyPropUpdate',
  surveyPublish: 'surveyPublish',
  surveyCollectImport: 'surveyCollectImport',

  // nodeDef
  nodeDefCreate: 'nodeDefCreate',
  nodeDefUpdate: 'nodeDefUpdate',
  nodeDefMarkDeleted: 'nodeDefMarkDeleted',

  //category
  categoryInsert: 'categoryInsert',
  categoryPropUpdate: 'categoryPropUpdate',
  categoryDelete: 'categoryDelete',
  categoryLevelInsert: 'categoryLevelInsert',
  categoryLevelPropUpdate: 'categoryLevelPropUpdate',
  categoryLevelDelete: 'categoryLevelDelete',
  categoryLevelsDelete: 'categoryLevelsDelete', //system
  categoryItemInsert: 'categoryItemInsert',
  categoryItemPropUpdate: 'categoryItemPropUpdate',
  categoryItemDelete: 'categoryItemDelete',
  categoryImport: 'categoryImport',

  //taxonomy
  taxonomyCreate: 'taxonomyCreate',
  taxonomyPropUpdate: 'taxonomyPropUpdate',
  taxonomyDelete: 'taxonomyDelete',
  taxonomyTaxaDelete: 'taxonomyTaxaDelete', //system
  taxonomyTaxaImport: 'taxonomyTaxaImport',
  taxonInsert: 'taxonInsert', //system

  //record
  recordCreate: 'recordCreate',
  recordDelete: 'recordDelete',
  recordStepUpdate: 'recordStepUpdate',

  //node
  nodeCreate: 'nodeCreate',
  nodeValueUpdate: 'nodeValueUpdate',
  nodeDelete: 'nodeDelete',

  // user
  userInvite: 'userInvite',
  userUpdate: 'userUpdate',
  userRemove: 'userRemove',

  // analysis
  processingChainCreate: 'processingChainCreate',
  processingChainPropUpdate: 'processingChainPropUpdate',
  processingChainDelete: 'processingChainDelete',
  processingStepCreate: 'processingStepCreate',
  processingStepPropsUpdate: 'processingStepPropsUpdate',
  processingStepDelete: 'processingStepDelete',
}

export const keys = {
  content: 'content',
  dateCreated: ObjectUtils.keys.dateCreated,
  type: 'type',
  system: 'system',
  userUuid: 'userUuid',

  //props associated from fetch
  userName: 'userName',
  recordUuid: 'recordUuid',
  parentPath: 'parentPath',
  nodeDefUuid: 'nodeDefUuid',
  //user
  targetUserName: 'targetUserName',
  targetUserEmail: 'targetUserEmail',
  targetUserUuid: 'targetUserUuid',
  //analysis
  processingChainLabels: 'processingChainLabels',
  processingStepIndex: 'processingStepIndex',
}

export const keysContent = {
  uuid: ObjectUtils.keys.uuid,
  parentUuid: ObjectUtils.keys.parentUuid,
  name: ObjectUtils.keys.name,
  key: 'key',
  value: 'value',
  //category
  categoryName: 'categoryName',
  categoryUuid: 'categoryUuid',
  index: 'index',
  code: 'code',
  levelUuid: 'levelUuid',
  //taxonomy
  taxonomyName: 'taxonomyName',
  //record
  keys: 'keys',
  stepFrom: 'stepFrom',
  stepTo: 'stepTo',
  //node
  nodeDefUuid: 'nodeDefUuid',
  recordUuid: 'recordUuid',
  //user
  groupUuid: 'groupUuid',
  //analysis
  labels: 'labels',
  processingChainUuid: 'processingChainUuid',
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

// props associated from fetch
export const getUserName = R.prop(keys.userName)
export const getRecordUuid = R.prop(keys.recordUuid)
export const getParentPath = R.prop(keys.parentPath)
export const getNodeDefUuid = R.prop(keys.nodeDefUuid)
export const getTargetUserName = R.prop(keys.targetUserName)
export const getTargetUserUuid = R.prop(keys.targetUserUuid)
export const getTargetUserEmail = R.prop(keys.targetUserEmail)
export const getProcessingChainLabels = R.prop(keys.processingChainLabels)
export const getProcessingStepIndex = R.prop(keys.processingStepIndex)

// content props
const _getContentProp = prop => R.path([keys.content, prop])
export const getContentUuid = _getContentProp(keysContent.uuid)
export const getContentParentUuid = _getContentProp(keysContent.parentUuid)
export const getContentName = _getContentProp(keysContent.name)
export const getContentKey = _getContentProp(keysContent.key)
// content props category
export const getContentCategoryName = _getContentProp(keysContent.categoryName)
export const getContentCategoryUuid = _getContentProp(keysContent.categoryUuid)
export const getContentIndex = _getContentProp(keysContent.index)
export const getContentCode = _getContentProp(keysContent.code)
export const getContentLevelUuid = _getContentProp(keysContent.levelUuid)
// content props taxonomy
export const getContentTaxonomyName = _getContentProp(keysContent.taxonomyName)
// content props record
export const getContentKeys = _getContentProp(keysContent.keys)
export const getContentStepFrom = _getContentProp(keysContent.stepFrom)
export const getContentStepTo = _getContentProp(keysContent.stepTo)
export const getContentNodeDefUuid = _getContentProp(keysContent.nodeDefUuid)
export const getContentRecordUuid = _getContentProp(keysContent.recordUuid)
// content props user
export const getContentGroupUuid = _getContentProp(keysContent.groupUuid)
// content props analysis
export const getContentLabels = _getContentProp(keysContent.labels)
