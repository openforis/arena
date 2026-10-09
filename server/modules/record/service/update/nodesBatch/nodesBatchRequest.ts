import SystemError, { StatusCodes } from '@core/systemError'

import {
  NodesBatchEdit,
  NodesBatchLimits,
  NodesBatchMessageKeys,
  NodesBatchRecordEdit,
  NodesBatchRequest,
} from './nodesBatchTypes'

const maxUuidLength = 64

/**
 * Builds the 400 error of an invalid request.
 * @param {string} reason - What is wrong.
 * @param {object} [params] - Extra params.
 * @returns {SystemError} The error.
 */
const invalidRequest = (reason: string, params: Record<string, unknown> = {}): SystemError =>
  new SystemError(NodesBatchMessageKeys.invalidRequest, { reason, ...params }, StatusCodes.BAD_REQUEST)

/**
 * Returns true for a non-empty string of uuid size.
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is a usable id.
 */
const isId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= maxUuidLength

/**
 * Validates one edit and fills the missing from/to with null.
 * @param {unknown} edit - The edit from the body.
 * @returns {NodesBatchEdit} The edit.
 */
const parseEdit = (edit: unknown): NodesBatchEdit => {
  if (!edit || typeof edit !== 'object') throw invalidRequest('edit')
  const { recordUuid, nodeUuid, from = null, to = null } = edit as Record<string, unknown>
  if (!isId(recordUuid) || !isId(nodeUuid)) throw invalidRequest('edit')
  return { recordUuid, nodeUuid, from, to }
}

/**
 * Checks the request limits: no node twice, at most 50 records.
 * @param {NodesBatchEdit[]} edits - The edits.
 * @returns {void}
 */
const checkEditsSet = (edits: NodesBatchEdit[]): void => {
  const nodeUuids = new Set(edits.map((edit) => edit.nodeUuid))
  if (nodeUuids.size !== edits.length) throw invalidRequest('duplicateNode')
  const recordUuids = new Set(edits.map((edit) => edit.recordUuid))
  if (recordUuids.size > NodesBatchLimits.maxRecords) {
    throw invalidRequest('tooManyRecords', { max: NodesBatchLimits.maxRecords })
  }
}

/**
 * Validates the body of POST /records/nodes/update.
 * @param {unknown} body - The request body: { cycle, edits: [{ recordUuid, nodeUuid, from, to }] }.
 * @returns {NodesBatchRequest} The request.
 */
export const parseNodesBatchRequest = (body: unknown): NodesBatchRequest => {
  const { cycle, edits } = (body ?? {}) as Record<string, unknown>
  if ((typeof cycle !== 'string' && typeof cycle !== 'number') || String(cycle) === '') throw invalidRequest('cycle')
  if (!Array.isArray(edits) || edits.length === 0) throw invalidRequest('edits')
  if (edits.length > NodesBatchLimits.maxEdits) {
    throw invalidRequest('tooManyEdits', { max: NodesBatchLimits.maxEdits })
  }
  const parsedEdits = edits.map(parseEdit)
  checkEditsSet(parsedEdits)
  return { cycle: String(cycle), edits: parsedEdits }
}

/**
 * Groups the edits by record, in request order, keeping each edit's index in the request.
 * @param {NodesBatchEdit[]} edits - The edits.
 * @returns {Map<string, NodesBatchRecordEdit[]>} The edits by record uuid.
 */
export const groupEditsByRecord = (edits: NodesBatchEdit[]): Map<string, NodesBatchRecordEdit[]> => {
  const editsByRecordUuid = new Map<string, NodesBatchRecordEdit[]>()
  for (const [index, { recordUuid, nodeUuid, from, to }] of edits.entries()) {
    const recordEdits = editsByRecordUuid.get(recordUuid) ?? []
    recordEdits.push({ index, nodeUuid, from, to })
    editsByRecordUuid.set(recordUuid, recordEdits)
  }
  return editsByRecordUuid
}
