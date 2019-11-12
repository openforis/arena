import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as Node from './node'
import * as NodeDef from '@core/survey/nodeDef'

export const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
  childrenCount: 'childrenCount',
  minCount: 'minCount',
  maxCount: 'maxCount',
}

// ===== CREATE
export const newValidationRecordDuplicate = (isUnique = false) => Validation.newInstance(
  isUnique,
  {
    [keys.recordKeys]: Validation.newInstance(
      isUnique,
      {},
      isUnique ? [] : [{ key: Validation.messageKeys.record.keyDuplicate }]
    )
  }
)

// ===== READ
export const getValidationChildrenCount = (parentNode, childDef) => R.pipe(
  Validation.getFieldValidation(Node.getUuid(parentNode)),
  Validation.getFieldValidation(keys.childrenCount),
  Validation.getFieldValidation(NodeDef.getUuid(childDef))
)

export const getNodeValidation = node =>
  R.pipe(
    Validation.getFieldValidation(Node.getUuid(node)),
    Validation.dissocFieldValidation(keys.childrenCount)
  )
