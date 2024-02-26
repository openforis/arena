import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid'

import { AppInfo } from '@core/app/appInfo'
import * as Validation from '@core/validation/validation'
import * as User from '@core/user/user'
import * as RecordStep from './recordStep'

import { keys, infoKeys } from './_record/recordKeys'
import * as RecordReader from './_record/recordReader'
import * as RecordUpdater from './_record/recordUpdater'
import { RecordNodesUpdater } from './_record/recordNodesUpdater'

export { keys, infoKeys } from './_record/recordKeys'

// ====== CREATE

export const newRecord = (user, cycle, preview = false, dateCreated = null, step = null) => ({
  [keys.uuid]: uuidv4(),
  [keys.ownerUuid]: User.getUuid(user),
  [keys.step]: step || RecordStep.getDefaultStep(),
  [keys.cycle]: cycle,
  [keys.preview]: preview,
  [keys.dateCreated]: dateCreated,
  [keys.info]: { [infoKeys.createdWith]: AppInfo.newAppInfo() },
})

// ====== READ
export const getSurveyUuid = R.prop(keys.surveyUuid)

export const { getUuid } = ObjectUtils
export const isPreview = R.propEq(keys.preview, true)
export const getOwnerUuid = R.prop(keys.ownerUuid)
export const getOwnerName = R.prop(keys.ownerName)
export const getStep = R.prop(keys.step)
export const isInAnalysisStep = (record) => {
  const stepId = getStep(record)
  const step = RecordStep.getStep(stepId)
  return RecordStep.getName(step) === RecordStep.stepNames.analysis
}
export const getCycle = R.prop(keys.cycle)
export const { getDateCreated } = ObjectUtils
export const { getDateModified } = ObjectUtils
export const getInfo = R.propOr({}, keys.info)

export const { getNodes, getNodesArray, getNodeByUuid, getRootNode, getNodesByDefUuid } = RecordReader

// ==== hierarchy
export const {
  getParentNode,
  getAncestorsAndSelf,
  getAncestorByNodeDefUuid,
  getNodeChildren,
  getNodeChildrenByDefUuid,
  getNodeChildrenByDefUuidUnsorted,
  getNodeChildByDefUuid,
  getNodeChildIndex,
  visitAncestorsAndSelf,
  visitDescendantsAndSelf,
} = RecordReader

// ==== utils
export const { isNodeApplicable, isNodeEmpty, isEmpty } = RecordReader

// ==== dependency
export const { getDependentNodePointers, getParentCodeAttribute, getDependentCodeAttributes } = RecordReader

// ====== Keys
export const { getEntityKeyNodes, getEntityKeyValues, findDescendantByKeyValues, findChildByKeyValues } = RecordReader

// ====== Unique
export const { getAttributesUniqueDependent, getAttributesUniqueSibling } = RecordReader

// ====== UPDATE
export const { assocDateModified, assocNodes, assocNode, dissocNodes, mergeNodes } = RecordUpdater
export const {
  createNodeAndDescendants,
  createRootEntity,
  getOrCreateEntityByKeys,
  updateNodesDependents,
  updateAttributesInEntityWithValues,
  updateAttributesWithValues,
  replaceUpdatedNodes,
  deleteNodesInEntityByNodeDefUuid,
} = RecordNodesUpdater
export const assocOwnerUuid = R.assoc(keys.ownerUuid)

// ====== DELETE
export const { deleteNode } = RecordUpdater

// ====== VALIDATION
export const { mergeNodeValidations } = RecordUpdater
export const { getValidation } = Validation
