import * as A from '@core/arena'

import * as ObjectUtils from '@core/objectUtils'

export const type = {
  // Survey
  surveyCreate: 'surveyCreate',
  surveyOwnerUpdate: 'surveyOwnerUpdate',
  surveyPropUpdate: 'surveyPropUpdate',
  surveyPublish: 'surveyPublish',
  surveyUnpublish: 'surveyUnpublish',
  surveyCollectImport: 'surveyCollectImport',
  surveyArenaImport: 'surveyArenaImport',
  surveyOdkImport: 'surveyOdkImport',

  // NodeDef
  nodeDefCreate: 'nodeDefCreate',
  nodeDefUpdate: 'nodeDefUpdate',
  nodeDefMarkDeleted: 'nodeDefMarkDeleted',
  nodeDefConversion: 'nodeDefConversion',
  nodeDefNodesDelete: 'nodeDefNodesDelete', // System

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
  categoryConvertToReportingData: 'categoryConvertToReportingData',
  categoryConvertToSamplingPointData: 'categoryConvertToSamplingPointData',
  categoryConvertToGeoPackage: 'categoryConvertToGeoPackage',

  // Taxonomy
  taxonomyCreate: 'taxonomyCreate',
  taxonomyPropUpdate: 'taxonomyPropUpdate',
  taxonomyDelete: 'taxonomyDelete',
  taxonomyTaxaDelete: 'taxonomyTaxaDelete', // System
  taxonomyTaxaImport: 'taxonomyTaxaImport',
  taxonInsert: 'taxonInsert', // System
  taxonUpdate: 'taxonUpdate', // System

  // Record
  recordCreate: 'recordCreate',
  recordDelete: 'recordDelete',
  recordOwnerUpdate: 'recordOwnerUpdate',
  recordStepUpdate: 'recordStepUpdate',
  recordImport: 'recordImport',
  recordImportFromCollect: 'recordImportFromCollect',
  recordMerge: 'recordMerge',

  // Node
  nodeCreate: 'nodeCreate',
  nodeValueUpdate: 'nodeValueUpdate',
  nodeDelete: 'nodeDelete',

  // User
  userInvite: 'userInvite',
  userUpdate: 'userUpdate',
  userRemove: 'userRemove',

  // Analysis
  chainCreate: 'chainCreate',
  chainPropUpdate: 'chainPropUpdate',
  analysisNodeDefPropUpdate: 'analysisNodeDefPropUpdate',
  chainStatusExecSuccess: 'chainStatusExecSuccess',
  chainDelete: 'chainDelete',
}

export const keys = {
  id: ObjectUtils.keys.id,
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
  chainUuid: 'chainUuid',
  chainLabels: 'chainLabels',
}

export const keysContent = {
  uuid: ObjectUtils.keys.uuid,
  parentUuid: ObjectUtils.keys.parentUuid,
  name: ObjectUtils.keys.name,
  key: 'key',
  value: 'value',
  // Category
  category: 'category',
  categoryName: 'categoryName',
  categoryUuid: 'categoryUuid',
  index: 'index',
  code: 'code',
  levelUuid: 'levelUuid',
  // Taxonomy
  taxonomy: 'taxonomy',
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
  chainUuid: 'chainUuid',
  indexFrom: 'indexFrom',
  indexTo: 'indexTo',
}

export interface ActivityLog {
  id?: number
  type?: string
  content?: Record<string, any>
  system?: boolean
  dateCreated?: string
  userUuid?: string
  // props associated from fetch
  [key: string]: unknown
}

type ActivityGetter<T> = (activityLog: ActivityLog) => T

// ====== CREATE
export const newActivity = (activityType: string, content: Record<string, any>, system = false): ActivityLog => ({
  [keys.type]: activityType,
  [keys.content]: content,
  [keys.system]: system,
})

// ====== READ

export const { getId } = ObjectUtils
export const getUserUuid: ActivityGetter<any> = A.prop(keys.userUuid)
export const getType: ActivityGetter<any> = A.prop(keys.type)
export const getContent: ActivityGetter<any> = A.prop(keys.content)
export const isSystem: ActivityGetter<any> = A.propEq(keys.system, true)
export const { getDateCreated } = ObjectUtils
// taxonomy
export const getTaxonomy: ActivityGetter<any> = A.prop(keysContent.taxonomy)
// cateogry
export const getCategory: ActivityGetter<any> = A.prop(keysContent.category)

// Props associated from fetch
export const getUserName: ActivityGetter<any> = A.prop(keys.userName)
export const getRecordUuid: ActivityGetter<any> = A.prop(keys.recordUuid)
export const getKeysHierarchy: ActivityGetter<any> = A.propOr([], keys.keysHierarchy)
export const getNodeDefUuid: ActivityGetter<any> = A.prop(keys.nodeDefUuid)
export const getTargetUserName: ActivityGetter<any> = A.prop(keys.targetUserName)
export const getTargetUserUuid: ActivityGetter<any> = A.prop(keys.targetUserUuid)
export const getTargetUserEmail: ActivityGetter<any> = A.prop(keys.targetUserEmail)
export const getChainUuid: ActivityGetter<any> = A.prop(keys.chainUuid)
export const getChainLabels: ActivityGetter<any> = A.prop(keys.chainLabels)

// Content props
const _getContentProp =
  (prop: string): ActivityGetter<any> =>
  (activityLog) =>
    A.path([keys.content, prop])(activityLog)
export const getContentUuid = _getContentProp(keysContent.uuid)
export const getContentParentUuid = _getContentProp(keysContent.parentUuid)
export const getContentName = _getContentProp(keysContent.name)
export const getContentKey = _getContentProp(keysContent.key)
export const getContentValue = _getContentProp(keysContent.value)
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
export const getContentChainUuid = _getContentProp(keysContent.chainUuid)
export const getContentLabels = _getContentProp(keysContent.labels)
export const getContentIndexFrom = _getContentProp(keysContent.indexFrom)
export const getContentIndexTo = _getContentProp(keysContent.indexTo)
