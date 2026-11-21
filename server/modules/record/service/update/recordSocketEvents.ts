/**
 * The socket events sent after a record update, shared by the records update thread (single node edits) and the batch
 * processor, so both send the same content.
 */
import { Objects } from '@openforis/arena-core'
import { WebSocketEvent } from '@openforis/arena-server'

import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'

export type RecordSocketEvent = { type: string; content: unknown }

/**
 * Builds the nodesUpdate event.
 * @param {object} params - The parameters.
 * @param {string} params.recordUuid - The record uuid.
 * @param {object} params.updatedNodes - The updated nodes by uuid.
 * @returns {RecordSocketEvent|null} The event, or null when no node was updated.
 */
export const buildNodesUpdateEvent = ({
  recordUuid,
  updatedNodes,
}: {
  recordUuid: string
  updatedNodes: unknown
}): RecordSocketEvent | null =>
  Objects.isEmpty(updatedNodes) ? null : { type: WebSocketEvent.nodesUpdate, content: { recordUuid, updatedNodes } }

/**
 * Builds the nodeValidationsUpdate event.
 * @param {object} params - The parameters.
 * @param {object} params.record - The record before the update.
 * @param {object} params.validations - The node validations.
 * @returns {RecordSocketEvent} The event.
 */
export const buildNodeValidationsUpdateEvent = ({
  record,
  validations,
}: {
  record: any
  validations: any
}): RecordSocketEvent => ({
  type: WebSocketEvent.nodeValidationsUpdate,
  content: {
    recordUuid: Record.getUuid(record),
    recordValid: Validation.isObjValid(Record.mergeNodeValidations(validations)(record)),
    validations,
  },
})
