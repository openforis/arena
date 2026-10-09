/**
 * Types, limits and result helpers of the batch record edit (POST /api/survey/:surveyId/records/nodes/update).
 */

export const NodesBatchLimits = {
  maxEdits: 200,
  maxRecords: 50,
  replyTimeoutMs: 60_000,
} as const

export const NodesBatchEditStatus = {
  applied: 'applied',
  conflict: 'conflict',
  failed: 'failed',
} as const

export type NodesBatchEditStatus = (typeof NodesBatchEditStatus)[keyof typeof NodesBatchEditStatus]

export const NodesBatchMessageKeys = {
  forbidden: 'appErrors:forbidden',
  lockTimeout: 'appErrors:record.lockTimeout',
  nodeNotInRecord: 'appErrors:record.nodeNotInRecord',
  invalidRequest: 'appErrors:record.nodesBatchInvalid',
  applyTimeout: 'appErrors:aiApplyTimeout',
  generic: 'appErrors:generic',
} as const

export type NodesBatchEdit = { recordUuid: string; nodeUuid: string; from: unknown; to: unknown }

// an edit of one record, with its position in the request
export type NodesBatchRecordEdit = { index: number; nodeUuid: string; from: unknown; to: unknown }

export type NodesBatchEditResult = {
  index: number
  status: NodesBatchEditStatus
  messageKey?: string
  params?: Record<string, unknown>
}

export type NodesBatchRequest = { cycle: string; edits: NodesBatchEdit[] }

export type NodesBatchPersistMessage = {
  type: string
  requestId: string
  user: any
  surveyId: number
  cycle: string
  draft: false
  recordUuid: string
  edits: NodesBatchRecordEdit[]
  timezoneOffset: number | null
  lang: string | null
}

export type NodesBatchPersistReply = { requestId: string; recordUuid: string; results: NodesBatchEditResult[] }

/**
 * Builds an applied result.
 * @param {number} index - The edit index in the request.
 * @returns {NodesBatchEditResult} The result.
 */
export const appliedResult = (index: number): NodesBatchEditResult => ({ index, status: NodesBatchEditStatus.applied })

/**
 * Builds a conflict result (the value changed since the proposal, or the node is gone).
 * @param {number} index - The edit index in the request.
 * @returns {NodesBatchEditResult} The result.
 */
export const conflictResult = (index: number): NodesBatchEditResult => ({
  index,
  status: NodesBatchEditStatus.conflict,
})

/**
 * Builds a failed result.
 * @param {number} index - The edit index in the request.
 * @param {string} messageKey - The i18n key of the reason.
 * @param {object} [params] - The message params.
 * @returns {NodesBatchEditResult} The result.
 */
export const failedResult = (
  index: number,
  messageKey: string,
  params?: Record<string, unknown>
): NodesBatchEditResult => ({
  index,
  status: NodesBatchEditStatus.failed,
  messageKey,
  ...(params ? { params } : {}),
})

/**
 * Builds a failed result for each edit.
 * @param {{index: number}[]} edits - The edits.
 * @param {string} messageKey - The i18n key of the reason.
 * @param {object} [params] - The message params.
 * @returns {NodesBatchEditResult[]} The results.
 */
export const failedResults = (
  edits: { index: number }[],
  messageKey: string,
  params?: Record<string, unknown>
): NodesBatchEditResult[] => edits.map(({ index }) => failedResult(index, messageKey, params))
