import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid'

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

export const { getUuid } = ObjectUtils
export const isPreview = R.propEq(keys.preview, true)
export const getOwnerUuid = R.prop(keys.ownerUuid)
export const getOwnerName = R.prop(keys.ownerName)
export const getStep = R.prop(keys.step)
export const getCycle = R.prop(keys.cycle)
export const { getDateCreated } = ObjectUtils
export const { getDateModified } = ObjectUtils

export const { getNodes } = RecordReader
export const { getNodeByUuid } = RecordReader
export const { getRootNode } = RecordReader
export const { getNodesByDefUuid } = RecordReader

// ==== hierarchy
export const { getParentNode } = RecordReader
export const { getAncestorsAndSelf } = RecordReader
export const { getAncestorByNodeDefUuid } = RecordReader

export const { getNodeChildren } = RecordReader
export const { getNodeChildrenByDefUuid } = RecordReader
export const { getNodeChildByDefUuid } = RecordReader
export const { visitDescendantsAndSelf } = RecordReader
export const { isNodeApplicable } = RecordReader

// ==== dependency
export const { getDependentNodePointers } = RecordReader
export const { getParentCodeAttribute } = RecordReader
export const { getDependentCodeAttributes } = RecordReader

// ====== Keys
export const { getEntityKeyNodes } = RecordReader
export const { getEntityKeyValues } = RecordReader

// ====== Unique
export const { getAttributesUniqueDependent, getAttributesUniqueSibling } = RecordReader

// ====== UPDATE
export const { assocNodes } = RecordUpdater
export const { assocNode } = RecordUpdater
export const { mergeNodes } = RecordUpdater

// ====== DELETE
export const { deleteNode } = RecordUpdater

// ====== VALIDATION
export const { mergeNodeValidations } = RecordUpdater
export const { getValidation } = Validation
