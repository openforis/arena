import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as Node from './node'

export const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
}

export const prefixValidationFieldChildrenCount = 'childrenCount_'

// ===== UTILS
export const getValidationChildrenCountKey = (nodeParentUuid, nodeDefChildUuid) =>
  `${prefixValidationFieldChildrenCount}${nodeParentUuid}_${nodeDefChildUuid}`
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
  Validation.getFieldValidation(getValidationChildrenCountKey(nodeParentUuid, nodeDefChildUuid))

export const getNodeValidation = (node) => Validation.getFieldValidation(Node.getUuid(node))

// ===== UPDATE
export const setValidationCount = (nodeParentUuid, nodeDefChildUuid, validationCount) =>
  Validation.setField(getValidationChildrenCountKey(nodeParentUuid, nodeDefChildUuid), validationCount)
