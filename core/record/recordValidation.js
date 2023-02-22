import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import { RecordValidations } from '@openforis/arena-core'

export const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
}

export const prefixValidationFieldChildrenCount = 'childrenCount_'

// ===== UTILS
export const getValidationChildrenCountKey = (nodeParentUuid, nodeDefChildUuid) =>
  RecordValidations.getValidationChildrenCountKey({ nodeParentUuid, nodeDefChildUuid })
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

export const getValidationChildrenCount = (nodeParentUuid, nodeDefChildUuid) =>
  RecordValidations.getValidationChildrenCount({ nodeParentUuid, nodeDefChildUuid })

export const getNodeValidation = (node) => RecordValidations.getValidationNode({ nodeUuid: node?.uuid })

// ===== UPDATE
export const setValidationCount = (nodeParentUuid, nodeDefChildUuid, validationCount) =>
  Validation.setField(getValidationChildrenCountKey(nodeParentUuid, nodeDefChildUuid), validationCount)
