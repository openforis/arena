import type { ArenaRecord, ArenaUser } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid'

import { AppInfo } from '@core/app/appInfo'
import * as Validation from '@core/validation/validation'
import * as User from '@core/user/user'
import * as RecordStep from './recordStep'
import type { RecordKeyValue } from './recordSummary'

import { keys, infoKeys } from './_record/recordKeys'
import * as RecordReader from './_record/recordReader'
import * as RecordUpdater from './_record/recordUpdater'
import { RecordNodesUpdater } from './_record/recordNodesUpdater'
import { RecordUserDependentStateUpdater } from './_record/recordUserDependentStateUpdater'

export { keys, infoKeys } from './_record/recordKeys'

type RecordUpdater = (record: ArenaRecord) => ArenaRecord

// ====== CREATE

export const newRecord = (
  user: ArenaUser,
  cycle: string,
  preview = false,
  dateCreated: string | null = null,
  step: string | null = null
): ArenaRecord => {
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
    [keys.info]: { [infoKeys.createdWith]: AppInfo.currentAppInfo },
  } as ArenaRecord
}

// ====== READ
const getStringProp =
  (key: string) =>
  (record: ArenaRecord): string | undefined =>
    A.prop(key)(record) as string | undefined

const isFlagTrue =
  (key: string) =>
  (record: ArenaRecord): boolean =>
    A.propEq(key, true)(record)

export const getSurveyUuid = getStringProp(keys.surveyUuid)

export const { getUuid } = ObjectUtils
export const isPreview = isFlagTrue(keys.preview)
export const isReadOnly = isFlagTrue(keys.readOnly)
export const getOwnerUuid = getStringProp(keys.ownerUuid)
export const getOwnerName = getStringProp(keys.ownerName)
export const getStep = getStringProp(keys.step)
// not delegated to Records.isInAnalysisStep: it must accept a null record (e.g. survey form in designer mode)
export const isInAnalysisStep = (record: ArenaRecord | null): boolean => {
  const step = RecordStep.getStep(getStep(record))
  return RecordStep.getName(step) === RecordStep.stepNames.analysis
}
export const getCycle = getStringProp(keys.cycle)
export const getMergedIntoRecordUuid = getStringProp(keys.mergedIntoRecordUuid)
export const { getDateCreated } = ObjectUtils
export const { getDateModified } = ObjectUtils
export const getInfo = (record: ArenaRecord): Record<string, any> =>
  A.propOr({}, keys.info)(record) as Record<string, any>
export const getCreatedWithAppId = (record: ArenaRecord): string => {
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
  findDescendantOrSelf,
} = RecordReader

// ==== utils
export const { isNodeApplicable, isNodeFilledByUser, isNodeEmpty, isEmpty } = RecordReader

// ==== dependency
export const { getDependentNodePointers, getParentCodeAttribute, getDependentCodeAttributes } = RecordReader

// ====== Keys
export const { getEntityKeyNodes, getEntityKeyValues, findDescendantByKeyValues, findChildByKeyValues } = RecordReader
export { EntityKeysIndexCache } from './_record/entityKeysIndexCache'

// ====== Unique
export const { getAttributesUniqueDependent, getAttributesUniqueSibling } = RecordReader

// ====== UPDATE
export const { assocDateModified, assocNodes, assocNode, dissocNodes, mergeNodes, replaceNodes } = RecordUpdater
export const {
  createRootEntity,
  getOrCreateEntityByKeys,
  afterNodesUpdate,
  updateNodesDependents,
  updateAttributesInEntityWithValues,
  updateAttributesWithValues,
  deleteNodes,
  deleteNodesInEntityByNodeDefUuid,
} = RecordNodesUpdater
export { replaceUpdatedNodes, mergeRecords } from './_record/recordsCombiner'
export const { recomputeUserDependentNodeState } = RecordUserDependentStateUpdater
export const assocOwnerUuid =
  (ownerUuid: string): RecordUpdater =>
  (record) =>
    A.assoc(keys.ownerUuid, ownerUuid, record)
export const assocReadOnly =
  (readOnly: boolean): RecordUpdater =>
  (record) =>
    A.assoc(keys.readOnly, readOnly, record)

// ====== DELETE
export const { deleteNode } = RecordUpdater

// ====== VALIDATION
export const { mergeNodeValidations } = RecordUpdater
export const { getValidation } = Validation

// ====== RECORD SUMMARY
const getNumberProp =
  (key: string) =>
  (record: ArenaRecord): number | undefined =>
    A.prop(key)(record) as number | undefined

const getKeyValuesObjProp =
  (key: string) =>
  (record: ArenaRecord): Record<string, RecordKeyValue> =>
    A.propOr({}, key)(record) as Record<string, RecordKeyValue>

export const getFilesCount = getNumberProp(keys.filesCount)
export const getFilesSize = getNumberProp(keys.filesSize)
export const getFilesMissing = getNumberProp(keys.filesMissing)

export const getKeysObj = getKeyValuesObjProp(keys.keysObj)
export const getSummaryAttributesObj = getKeyValuesObjProp(keys.summaryAttributesObj)
