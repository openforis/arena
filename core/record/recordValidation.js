import * as R from 'ramda'

import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import { RecordValidations } from '@openforis/arena-core'

export const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
}

export const prefixValidationFieldChildrenCount = 'childrenCount_'

// ===== UTILS
export const getValidationChildrenCountKey = (nodeParentIId, nodeDefChildUuid) =>
  RecordValidations.getValidationChildrenCountKey({ nodeParentInternalId: nodeParentIId, nodeDefChildUuid })
export const isValidationFieldKeyChildrenCount = R.startsWith(prefixValidationFieldChildrenCount)
export const isValidationResultErrorCount = (validationResult) =>
  ValidationResult.getKey(validationResult).startsWith('record.nodes.count.')
export const getValidationCountNodeDefUuid = (field) => R.pipe(R.split('_'), R.last)(field)

// ===== CREATE
export const newValidationRecordDuplicate = ({
  unique = false,
  errorKey = Validation.messageKeys.record.keyDuplicate,
} = {}) =>
  Validation.newInstance(unique, {
    [keys.recordKeys]: Validation.newInstance(unique, {}, unique ? [] : [{ key: errorKey }]),
  })

// ===== READ

export const getValidationChildrenCount = (nodeParentIId, nodeDefChildUuid) =>
  RecordValidations.getValidationChildrenCount({ nodeParentInternalId: nodeParentIId, nodeDefChildUuid })

export const getNodeValidation = (node) => RecordValidations.getValidationNode({ nodeInternalId: Node.getIId(node) })

// ===== UPDATE
export const setValidationCount = (nodeParentIId, nodeDefChildUuid, validationCount) =>
  Validation.setField(getValidationChildrenCountKey(nodeParentIId, nodeDefChildUuid), validationCount)
