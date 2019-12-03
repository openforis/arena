import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as Node from './node'

export const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
  childrenCount: 'childrenCount',
  minCount: 'minCount',
  maxCount: 'maxCount',
}

// ===== CREATE
export const newValidationRecordDuplicate = (isUnique = false) =>
  Validation.newInstance(isUnique, {
    [keys.recordKeys]: Validation.newInstance(
      isUnique,
      {},
      isUnique ? [] : [{ key: Validation.messageKeys.record.keyDuplicate }],
    ),
  })

// ===== READ
export const getValidationChildrenCount = childDefUuid =>
  R.pipe(
    Validation.getFieldValidation(keys.childrenCount),
    Validation.getFieldValidation(childDefUuid),
    R.ifElse(
      Validation.isValid,
      () => {},
      R.pipe(
        v => Validation.newInstance(false, { [childDefUuid]: v }),
        v => Validation.newInstance(false, { [keys.childrenCount]: v }),
      ),
    ),
  )

export const getNodeValidation = node =>
  R.pipe(
    Validation.getFieldValidation(Node.getUuid(node)),
    Validation.dissocFieldValidation(keys.childrenCount),
  )
