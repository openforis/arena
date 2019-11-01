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
  taxonInsert: 'taxonInsert',

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
}

export const keysContent = {
  nodeDefName: 'nodeDefName',
  nodeDefParentName: 'nodeDefParentName',
  userName: 'userName',
}

export const newActivity = (type, content, system = false) => ({
  [keys.type]: type,
  [keys.content]: content,
  [keys.system]: system,
})

export const getId = ObjectUtils.getId
export const getUserUuid = R.prop(keys.userUuid)
export const getType = R.prop(keys.type)
export const getContent = R.prop(keys.content)
export const isSystem = R.propEq(keys.system, true)
export const getDateCreated = ObjectUtils.getDateCreated

// content props
export const getUserName = R.path([keys.content, keysContent.userName])
export const getNodeDefName = R.path([keys.content, keysContent.nodeDefName])
export const getNodeDefParentName = R.path([keys.content, keys.nodeDefParentName])
