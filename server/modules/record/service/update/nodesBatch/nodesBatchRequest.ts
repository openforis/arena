import { NodesBatchLimits } from '@common/record/nodesBatchLimits'
import { isNodeValueSizeValid } from '@core/record/nodeValueShape'
import SystemError, { StatusCodes } from '@core/systemError'
import { isUuid } from '@core/uuid'

import { NodesBatchEdit, NodesBatchMessageKeys, NodesBatchRecordEdit, NodesBatchRequest } from './nodesBatchTypes'

/**
 * Builds the 400 error of an invalid request.
 * @param {string} reason - What is wrong.
 * @param {object} [params] - Extra params.
 */
const invalidRequest = (reason: string, params: Record<string, unknown> = {}): SystemError =>
  new SystemError(NodesBatchMessageKeys.invalidRequest, { reason, ...params }, StatusCodes.BAD_REQUEST)

/**
 * Returns true for a valid uuid (a malformed one would make the database query fail and roll the record back).
 * @returns {boolean} Whether the value is a usable id.
 */
const isId = (value: unknown): value is string => typeof value === 'string' && isUuid(value)

/**
 * Validates one edit (ids and size of the new value) and fills the missing from/to with null.
 * @param {unknown} edit - The edit from the body.
 */
const parseEdit = (edit: unknown): NodesBatchEdit => {
  if (!edit || typeof edit !== 'object') throw invalidRequest('edit')
  const { recordUuid, nodeUuid, from = null, to = null } = edit as Record<string, unknown>
  if (!isId(recordUuid) || !isId(nodeUuid)) throw invalidRequest('edit')
  // the shape of `to` depends on the attribute type: it is checked with the node, see checkBatchEdit; `from` is only
  // compared with the stored value (a long stored text is a conflict at most), so it has no size limit
  if (!isNodeValueSizeValid(to)) throw invalidRequest('valueTooLarge')
  // the database returns lower-case uuids: another case would miss the node and take another lock key
  return { recordUuid: recordUuid.toLowerCase(), nodeUuid: nodeUuid.toLowerCase(), from, to }
}

/**
 * Checks the request limits: no node twice, at most 50 records.
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
 * @param {string[]} [cycleKeys] - The survey cycle keys; when given, the cycle must be one of them (it becomes a cache key).
 */
export const parseNodesBatchRequest = (body: unknown, cycleKeys?: string[]): NodesBatchRequest => {
  const { cycle, edits } = (body ?? {}) as Record<string, unknown>
  if ((typeof cycle !== 'string' && typeof cycle !== 'number') || String(cycle) === '') throw invalidRequest('cycle')
  if (cycleKeys && !cycleKeys.includes(String(cycle))) throw invalidRequest('cycle')
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
