import * as R from 'ramda'

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
  categoryLevelsDelete: 'categoryLevelsDelete',
  categoryItemInsert: 'categoryItemInsert',
  categoryItemPropUpdate: 'categoryItemPropUpdate',
  categoryItemDelete: 'categoryItemDelete',
  categoryImport: 'categoryImport',

  //taxonomy
  taxonomyCreate: 'taxonomyCreate',
  taxonomyPropUpdate: 'taxonomyPropUpdate',
  taxonomyDelete: 'taxonomyDelete',
  taxonomyTaxaDelete: 'taxonomyTaxaDelete',
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
}

export const keys = {
  type: 'type',
  content: 'content',
  system: 'system',
}

export const newActivity = (type, content, system = false) => ({
  [keys.type]: type,
  [keys.content]: content,
  [keys.system]: system,
})

export const getType = R.prop(keys.type)
export const getContent = R.prop(keys.content)
export const isSystem = R.propEq(keys.system, true)