import { RecordValidations } from '@openforis/arena-core'
import type { ArenaRecordNode, Validation as ArenaValidation, ValidationResult } from '@openforis/arena-core'

import * as Validation from '@core/validation/validation'
import * as ValidationResultUtils from '@core/validation/validationResult'

export const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
} as const

export const prefixValidationFieldChildrenCount = 'childrenCount_'

// ===== UTILS
export const getValidationChildrenCountKey = (nodeParentUuid: string, nodeDefChildUuid: string): string =>
  RecordValidations.getValidationChildrenCountKey({ nodeParentUuid, nodeDefChildUuid })
export const isValidationFieldKeyChildrenCount = (field: string): boolean =>
  field.startsWith(prefixValidationFieldChildrenCount)
export const isValidationResultErrorCount = (validationResult: ValidationResult): boolean =>
  ValidationResultUtils.getKey(validationResult).startsWith('record.nodes.count.')
export const getValidationCountNodeDefUuid = (field: string): string => field.split('_').at(-1)

// ===== CREATE
export const newValidationRecordDuplicate = ({
  unique = false,
  errorKey = Validation.messageKeys.record.keyDuplicate,
}: {
  unique?: boolean
  errorKey?: string
} = {}): ArenaValidation =>
  Validation.newInstance(unique, {
    // error stored with its key only (as before)
    [keys.recordKeys]: Validation.newInstance(unique, {}, unique ? [] : [{ key: errorKey } as ValidationResult]),
  })

// ===== READ

export const getValidationChildrenCount = (nodeParentUuid: string, nodeDefChildUuid: string) =>
  RecordValidations.getValidationChildrenCount({ nodeParentUuid, nodeDefChildUuid })

export const getNodeValidation = (node: ArenaRecordNode | null | undefined) =>
  RecordValidations.getValidationNode({ nodeUuid: node?.uuid })

// ===== UPDATE
export const setValidationCount = (
  nodeParentUuid: string,
  nodeDefChildUuid: string,
  validationCount: ArenaValidation
) => Validation.setField(getValidationChildrenCountKey(nodeParentUuid, nodeDefChildUuid), validationCount)
