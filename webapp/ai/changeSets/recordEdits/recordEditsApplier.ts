import type { ChangeSet, OperationResult } from '@webapp/ai/changeSets/types'
import { isTimeoutError } from '@webapp/ai/tools/analysis/analysisApi'

import { type PostRecordEdits, postRecordEdits } from './recordEditsClient'
import { isRecordEditOperation, type RecordAttributeUpdateOperation, type RecordEditResult } from './types'

/**
 * Converts a result of the endpoint into the result of an operation.
 * @param {string} id - Operation id.
 * @param {RecordEditResult} [result] - Endpoint result.
 * @returns {OperationResult} The operation result.
 */
const toOperationResult = (id: string, result?: RecordEditResult): OperationResult => {
  if (!result) return { id, status: 'failed', message: 'appErrors:generic', params: { text: 'no result' } }
  const { status, messageKey, params } = result
  return { id, status, ...(messageKey ? { message: messageKey } : {}), ...(params ? { params } : {}) }
}

/**
 * Returns the failed result of a request error: the server's message key, or a network error.
 * @param {string} id - Operation id.
 * @param {unknown} error - The axios error.
 * @returns {OperationResult} The result.
 */
export const toChunkErrorResult = (id: string, error: any): OperationResult => {
  const data = error?.response?.data
  // the edits may have been written: the message tells the user to check the records
  if ((isTimeoutError(error) || error?.code === 'ERR_CANCELED') && !data?.key)
    return { id, status: 'failed', message: 'appErrors:aiApplyTimeout' }
  if (data?.key) return { id, status: 'failed', message: data.key, params: data.params ?? {} }
  return { id, status: 'failed', message: 'appErrors:networkError' }
}

/**
 * Sends the edits in one request (the propose tool caps a change set at the endpoint limits) and returns their results.
 * @param {object} params - Parameters.
 * @param {RecordAttributeUpdateOperation[]} params.chunk - The edits.
 * @param {PostRecordEdits} params.post - Endpoint call.
 * @param {object} params.request - surveyId, cycle, timezoneOffset, lang, signal.
 * @returns {Promise<OperationResult[]>} The results, in edit order.
 */
const applyChunk = async ({
  chunk,
  post,
  request,
}: {
  chunk: RecordAttributeUpdateOperation[]
  post: PostRecordEdits
  request: { surveyId: number; cycle: string; timezoneOffset: number; lang: string; signal?: AbortSignal }
}): Promise<OperationResult[]> => {
  try {
    const results = await post({
      ...request,
      edits: chunk.map(({ recordUuid, nodeUuid, from, to }) => ({ recordUuid, nodeUuid, from, to })),
    })
    const resultByIndex = new Map(results.map((result) => [result.index, result]))
    return chunk.map((operation, index) => toOperationResult(operation.id, resultByIndex.get(index)))
  } catch (error) {
    return chunk.map((operation) => toChunkErrorResult(operation.id, error))
  }
}

/**
 * Applies the selected edits of a record-edit change set.
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - The change set.
 * @param {string[]} params.operationIds - Selected edits.
 * @param {string} params.cycle - Current survey cycle (used when the edits carry none).
 * @param {number} params.timezoneOffset - Browser timezone offset.
 * @param {string} params.lang - Survey language.
 * @param {PostRecordEdits} [params.post] - Endpoint call (injectable for tests).
 * @param {Function} [params.onProgress] - Called with (requests done, requests total).
 * @param {AbortSignal} [params.signal] - Aborts the request in flight.
 * @returns {Promise<OperationResult[]>} One result per selected edit, in operation order.
 */
export const applyRecordEdits = async ({
  changeSet,
  operationIds,
  cycle,
  timezoneOffset,
  lang,
  post = postRecordEdits,
  onProgress,
  signal,
}: {
  changeSet: ChangeSet
  operationIds: string[]
  cycle: string
  timezoneOffset: number
  lang: string
  post?: PostRecordEdits
  onProgress?: (done: number, total: number) => void
  signal?: AbortSignal
}): Promise<OperationResult[]> => {
  const selected = changeSet.operations.filter(
    (operation): operation is RecordAttributeUpdateOperation =>
      isRecordEditOperation(operation) && operationIds.includes(operation.id)
  )
  // the cycle of the proposal wins over the current one (a record of another cycle would be a conflict)
  const request = {
    surveyId: changeSet.surveyId,
    cycle: selected[0]?.cycle ?? cycle,
    timezoneOffset,
    lang,
    ...(signal ? { signal } : {}),
  }
  onProgress?.(0, 1)
  const results = await applyChunk({ chunk: selected, post, request })
  onProgress?.(1, 1)
  const resultById = new Map(results.map((result) => [result.id, result]))
  return selected.map((operation) => resultById.get(operation.id) as OperationResult)
}
