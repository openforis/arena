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

export const newRecord = (user, cycle, preview = false, dateCreated = null, step = null) => {
  const role = null
  return {
    [keys.uuid]: uuidv4(),
    [keys.ownerEmail]: User.getEmail(user),
    [keys.ownerName]: User.getName(user),
    [keys.ownerRole]: role,
    [keys.ownerUuid]: User.getUuid(user),
    [keys.step]: step || RecordStep.getDefaultStep(),
    [keys.cycle]: cycle,
    [keys.preview]: preview,
    [keys.dateCreated]: dateCreated,
    [keys.info]: { [infoKeys.createdWith]: AppInfo.newAppInfo() },
  }
}

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
export const getMergedIntoRecordUuid = R.prop(keys.mergedIntoRecordUuid)
export const { getDateCreated } = ObjectUtils
export const { getDateModified } = ObjectUtils
export const getInfo = R.propOr({}, keys.info)
export const getCreatedWithAppId = (record) => {
  const info = getInfo(record)
  const createdWith = info[infoKeys.createdWith]
  return AppInfo.getAppId(createdWith)
}

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
  findNodeChildren,
  visitAncestorsAndSelf,
  visitDescendantsAndSelf,
} = RecordReader

// ==== utils
export const { isNodeApplicable, isNodeFilledByUser, isNodeEmpty, isEmpty } = RecordReader

// ==== dependency
export const { getDependentNodePointers, getParentCodeAttribute, getDependentCodeAttributes } = RecordReader

// ====== Keys
export const { getEntityKeyNodes, getEntityKeyValues, findDescendantByKeyValues, findChildByKeyValues } = RecordReader

// ====== Unique
export const { getAttributesUniqueDependent, getAttributesUniqueSibling } = RecordReader

// ====== UPDATE
export const { assocDateModified, assocNodes, assocNode, dissocNodes, mergeNodes } = RecordUpdater
export const {
  createRootEntity,
  getOrCreateEntityByKeys,
  updateNodesDependents,
  updateAttributesInEntityWithValues,
  updateAttributesWithValues,
  deleteNodes,
  deleteNodesInEntityByNodeDefUuid,
} = RecordNodesUpdater
export { replaceUpdatedNodes, mergeRecords } from './_record/recordsCombiner'
export const assocOwnerUuid = R.assoc(keys.ownerUuid)

// ====== DELETE
export const { deleteNode } = RecordUpdater

// ====== VALIDATION
export const { mergeNodeValidations } = RecordUpdater
export const { getValidation } = Validation

// ====== RECORD SUMMARY
export const getFilesCount = R.prop(keys.filesCount)
export const getFilesSize = R.prop(keys.filesSize)
export const getFilesMissing = R.prop(keys.filesMissing)
