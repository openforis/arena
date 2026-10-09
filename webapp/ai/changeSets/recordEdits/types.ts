import type { ChangeSet } from '@webapp/ai/changeSets/types'

export const RECORD_ATTRIBUTE_UPDATE = 'record.attributeUpdate'

// one change set; the model is told to split larger fixes
export const RECORD_EDITS_MAX = 200

export type RecordEditBadge = 'fixes' | 'stillInvalid' | 'noErrors'

export type RecordEditPreview = {
  badge: RecordEditBadge
  // validation messages of the attribute after the edit (stillInvalid)
  messages: string[]
  // other nodes of the record that become invalid (the record's edits are previewed together)
  recordNewErrors: number
}

export type RecordAttributeUpdateOperation = {
  id: string
  type: typeof RECORD_ATTRIBUTE_UPDATE
  recordUuid: string
  nodeUuid: string
  nodeDefUuid: string
  recordKeys: string
  path: string
  from: any
  to: any
  preview: RecordEditPreview
  // the record editor page (parent entity) of the node, for the link of the card
  page: { nodeUuid: string; nodeDefUuid: string }
  // formatted values, computed with the record at proposal time
  display: { from: string | null; to: string | null }
}

export type RecordEditStatus = 'applied' | 'conflict' | 'failed'

export type RecordEditResult = {
  index: number
  status: RecordEditStatus
  messageKey?: string
  params?: Record<string, unknown>
}

/**
 * Returns true for a record-edit operation.
 * @param {object} operation - Any change set operation.
 * @returns {boolean} Whether it is a record.attributeUpdate operation.
 */
export const isRecordEditOperation = <T extends { type: string }>(
  operation: T
): operation is Extract<T, { type: typeof RECORD_ATTRIBUTE_UPDATE }> => operation.type === RECORD_ATTRIBUTE_UPDATE

/**
 * Returns true when every operation of the change set is a record edit (rendered by the record-edit card).
 * @param {ChangeSet} changeSet - The change set.
 * @returns {boolean} Whether it is a record-edit change set.
 */
export const isRecordEditChangeSet = (changeSet: ChangeSet): boolean =>
  changeSet.operations.length > 0 && changeSet.operations.every(isRecordEditOperation)
