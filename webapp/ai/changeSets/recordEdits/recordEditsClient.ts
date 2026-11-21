import axios from 'axios'

import type { RecordEditResult } from './types'

// a little over the server's own 60 s reply timeout, so the server's timeout result arrives first
export const RECORD_EDITS_REQUEST_TIMEOUT_MS = 75_000

export type RecordEditsRequest = {
  surveyId: number
  cycle: string
  edits: { recordUuid: string; nodeUuid: string; from: any; to: any }[]
  timezoneOffset: number
  lang: string
  signal?: AbortSignal
}

export type PostRecordEdits = (request: RecordEditsRequest) => Promise<RecordEditResult[]>

/**
 * Sends edits to the batch record edit endpoint (synchronous: it answers when the edits are written).
 * @param {RecordEditsRequest} request - The request.
 * @returns {Promise<RecordEditResult[]>} One result per edit (index = position in the request).
 */
export const postRecordEdits: PostRecordEdits = async ({ surveyId, signal, ...body }) => {
  const { data } = await axios.post(`/api/survey/${surveyId}/records/nodes/update`, body, {
    signal,
    timeout: RECORD_EDITS_REQUEST_TIMEOUT_MS,
  })
  return data.results
}
