import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid';

import * as Validation from '@core/validation/validation'
import * as User from '@core/user/user'
import * as RecordStep from './recordStep'

import { keys } from './_record/recordKeys'
import * as RecordReader from './_record/recordReader'
import * as RecordUpdater from './_record/recordUpdater'

export { keys } from './_record/recordKeys'

// ====== CREATE

export const newRecord = (user, cycle, preview = false, dateCreated = null, step = null) => ({
  [keys.uuid]: uuidv4(),
  [keys.ownerUuid]: User.getUuid(user),
  [keys.step]: step || RecordStep.getDefaultStep(),
  [keys.cycle]: cycle,
  [keys.preview]: preview,
  [keys.dateCreated]: dateCreated,
})

// ====== READ
export const getSurveyUuid = R.prop(keys.surveyUuid)

export const getUuid = ObjectUtils.getUuid
export const isPreview = R.propEq(keys.preview, true)
export const getOwnerUuid = R.prop(keys.ownerUuid)
export const getOwnerName = R.prop(keys.ownerName)
export const getStep = R.prop(keys.step)
export const getCycle = R.prop(keys.cycle)
export const getDateCreated = ObjectUtils.getDateCreated
export const getDateModified = ObjectUtils.getDateModified

export const getNodes = RecordReader.getNodes
export const getNodeByUuid = RecordReader.getNodeByUuid
export const getRootNode = RecordReader.getRootNode
export const getNodesByDefUuid = RecordReader.getNodesByDefUuid

// ==== hierarchy
export const getParentNode = RecordReader.getParentNode
export const getAncestorsAndSelf = RecordReader.getAncestorsAndSelf
export const getAncestorByNodeDefUuid = RecordReader.getAncestorByNodeDefUuid

export const getNodeChildren = RecordReader.getNodeChildren
export const getNodeChildrenByDefUuid = RecordReader.getNodeChildrenByDefUuid
export const getNodeChildByDefUuid = RecordReader.getNodeChildByDefUuid
export const visitDescendantsAndSelf = RecordReader.visitDescendantsAndSelf
export const isNodeApplicable = RecordReader.isNodeApplicable

// ==== dependency
export const getDependentNodePointers = RecordReader.getDependentNodePointers
export const getParentCodeAttribute = RecordReader.getParentCodeAttribute
export const getDependentCodeAttributes = RecordReader.getDependentCodeAttributes

// ====== Keys
export const getEntityKeyNodes = RecordReader.getEntityKeyNodes
export const getEntityKeyValues = RecordReader.getEntityKeyValues

// ====== UPDATE
export const assocNodes = RecordUpdater.assocNodes
export const assocNode = RecordUpdater.assocNode
export const mergeNodes = RecordUpdater.mergeNodes

// ====== DELETE
export const deleteNode = RecordUpdater.deleteNode

// ====== VALIDATION
export const mergeNodeValidations = RecordUpdater.mergeNodeValidations
export const getValidation = Validation.getValidation

