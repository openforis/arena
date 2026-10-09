import type { ChangeSet, OperationResult } from '@webapp/ai/changeSets/types'
import { isTimeoutError } from '@webapp/ai/tools/analysis/analysisApi'

import { postRecordEdits, type PostRecordEdits } from './recordEditsClient'
import { isRecordEditOperation, type RecordAttributeUpdateOperation, type RecordEditResult } from './types'

// the endpoint accepts at most 50 records per request
export const RECORDS_PER_REQUEST = 50

/**
 * Splits edits into chunks of at most `maxRecords` records; all the edits of a record go to the same chunk.
 * @param {RecordAttributeUpdateOperation[]} operations - Edits, in change set order.
 * @param {number} [maxRecords] - Records per chunk.
 * @returns {RecordAttributeUpdateOperation[][]} The chunks.
 */
export const chunkOperationsByRecord = (
  operations: RecordAttributeUpdateOperation[],
  maxRecords: number = RECORDS_PER_REQUEST
): RecordAttributeUpdateOperation[][] => {
  const chunks: RecordAttributeUpdateOperation[][] = []
  const chunkIndexByRecord = new Map<string, number>()
  let recordsInLastChunk = 0
  for (const operation of operations) {
    let chunkIndex = chunkIndexByRecord.get(operation.recordUuid)
    if (chunkIndex === undefined) {
      if (chunks.length === 0 || recordsInLastChunk === maxRecords) {
        chunks.push([])
        recordsInLastChunk = 0
      }
      chunkIndex = chunks.length - 1
      chunkIndexByRecord.set(operation.recordUuid, chunkIndex)
      recordsInLastChunk += 1
    }
    chunks[chunkIndex].push(operation)
  }
  return chunks
}

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
const toRequestErrorResult = (id: string, error: any): OperationResult => {
  const data = error?.response?.data
  // the edits may have been written: the message tells the user to check the records
  if (isTimeoutError(error) && !data?.key) return { id, status: 'failed', message: 'appErrors:aiApplyTimeout' }
  if (data?.key) return { id, status: 'failed', message: data.key, params: data.params ?? {} }
  return { id, status: 'failed', message: 'appErrors:networkError' }
}

/**
 * Sends one chunk and returns the results of its edits.
 * @param {object} params - Parameters.
 * @param {RecordAttributeUpdateOperation[]} params.chunk - The edits.
 * @param {PostRecordEdits} params.post - Endpoint call.
 * @param {object} params.request - surveyId, cycle, timezoneOffset, lang, signal.
 * @returns {Promise<OperationResult[]>} The results, in chunk order.
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
    return chunk.map((operation) => toRequestErrorResult(operation.id, error))
  }
}

/**
 * Applies the selected edits of a record-edit change set, chunk by chunk.
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - The change set.
 * @param {string[]} params.operationIds - Selected edits.
 * @param {string} params.cycle - Survey cycle.
 * @param {number} params.timezoneOffset - Browser timezone offset.
 * @param {string} params.lang - Survey language.
 * @param {PostRecordEdits} [params.post] - Endpoint call (injectable for tests).
 * @param {Function} [params.onProgress] - Called with (chunks done, chunks total).
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
  const chunks = chunkOperationsByRecord(selected)
  const request = { surveyId: changeSet.surveyId, cycle, timezoneOffset, lang, ...(signal ? { signal } : {}) }
  const results: OperationResult[] = []
  onProgress?.(0, chunks.length)
  for (const [index, chunk] of chunks.entries()) {
    results.push(...(await applyChunk({ chunk, post, request })))
    onProgress?.(index + 1, chunks.length)
  }
  const resultById = new Map(results.map((result) => [result.id, result]))
  return selected.map((operation) => resultById.get(operation.id) as OperationResult)
}
