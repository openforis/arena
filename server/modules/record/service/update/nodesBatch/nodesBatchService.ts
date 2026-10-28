/**
 * Batch record edit (assistant record-edit change sets): one nodesBatchPersist message per record to the records
 * update thread, which checks and applies the edits inside the record lock, waiting for the replies.
 */
import type { User as ArenaUser } from '@openforis/arena-core'

import SystemError from '@core/systemError'
import * as User from '@core/user/user'
import { uuidv4 } from '@core/uuid'
import { NodesBatchLimits } from '@common/record/nodesBatchLimits'

import * as Log from '@server/log/log'

import { RecordsUpdateThreadService } from '../surveyRecordsThreadService'
import { RecordsUpdateThreadMessageTypes } from '../thread/recordsThreadMessageTypes'
import { NodesBatchReplies, NodesBatchReplyRegistry } from './nodesBatchReplies'
import { groupEditsByRecord } from './nodesBatchRequest'
import { NodesBatchProcessSlots, NodesBatchSlots } from './nodesBatchSlots'
import {
  NodesBatchEdit,
  NodesBatchEditResult,
  NodesBatchMessageKeys,
  NodesBatchPersistMessage,
  NodesBatchRecordEdit,
  failedResults,
} from './nodesBatchTypes'

const Logger = Log.getLogger('NodesBatchService')

const TOO_MANY_REQUESTS = 429
const GATEWAY_TIMEOUT = 504

// the thread stops before the caller stops waiting, so a commit never lands after the timeout was reported
const COMMIT_MARGIN_MS = 2000
// a batch that never ends (a reply wait that is never released) gives its slot back after the deadline plus this
const SLOT_RELEASE_GRACE_MS = 5000

export type NodesBatchServiceDeps = {
  postBatchMessage: (msg: NodesBatchPersistMessage) => void
  replies: NodesBatchReplyRegistry
  slots: NodesBatchSlots
  logError: (message: string) => void
}

type RequestContext = {
  user: ArenaUser
  surveyId: number
  cycle: string
  timezoneOffset: number | null
  lang: string | null
  // one deadline for the whole request: the records are sent one after the other
  deadline: number
  deps: NodesBatchServiceDeps
}

/**
 * Creates the dependencies of the service (database, records update thread, reply channel).
 * @returns {NodesBatchServiceDeps} The dependencies.
 */
export const createDefaultNodesBatchServiceDeps = (): NodesBatchServiceDeps => ({
  postBatchMessage: (msg) => RecordsUpdateThreadService.getOrCreatedThread().postMessage(msg),
  replies: NodesBatchReplies,
  slots: NodesBatchProcessSlots,
  logError: (message) => Logger.error(message),
})

/**
 * Sends the edits of a record to the records update thread and waits for the reply.
 * @param {RequestContext} context - The request context.
 * @param {string} recordUuid - The record uuid.
 * @param {NodesBatchRecordEdit[]} edits - The edits to apply.
 * @returns {Promise<NodesBatchEditResult[]>} The results (failed with appErrors:aiApplyTimeout without reply before the request deadline).
 */
const sendRecordEdits = async (
  context: RequestContext,
  recordUuid: string,
  edits: NodesBatchRecordEdit[]
): Promise<NodesBatchEditResult[]> => {
  const { user, surveyId, cycle, timezoneOffset, lang, deadline, deps } = context
  const requestId = uuidv4()
  // registered before posting, so the reply can't be missed
  const reply = deps.replies.waitFor(requestId, Math.max(0, deadline - Date.now()))
  try {
    deps.postBatchMessage({
      type: RecordsUpdateThreadMessageTypes.nodesBatchPersist,
      requestId,
      user,
      surveyId,
      cycle,
      draft: false,
      recordUuid,
      edits,
      timezoneOffset,
      lang,
      deadline: deadline - COMMIT_MARGIN_MS,
    })
  } catch (error) {
    // nothing was sent: drop the waiting reply (its timer would keep the entry until the deadline)
    deps.replies.resolveReply({ requestId, results: failedResults(edits, NodesBatchMessageKeys.unexpected) })
    throw error
  }
  const results = await reply
  return results ?? failedResults(edits, NodesBatchMessageKeys.applyTimeout)
}

/**
 * Sends the edits of a record; a failure to send fails only the edits of this record. The returned promise never
 * rejects, so it can wait for the others without an unhandled rejection.
 * @param {RequestContext} context - The request context.
 * @param {string} recordUuid - The record uuid.
 * @param {NodesBatchRecordEdit[]} edits - The edits to apply.
 * @returns {Promise<NodesBatchEditResult[]>} The results.
 */
const sendRecordEditsSafely = async (
  context: RequestContext,
  recordUuid: string,
  edits: NodesBatchRecordEdit[]
): Promise<NodesBatchEditResult[]> => {
  try {
    return await sendRecordEdits(context, recordUuid, edits)
  } catch (error) {
    context.deps.logError(`error sending the batch edits of record ${recordUuid}: ${(error as Error)?.stack ?? error}`)
    return failedResults(edits, NodesBatchMessageKeys.unexpected)
  }
}

type NodesBatchParams = {
  user: ArenaUser
  surveyId: number
  cycle: string
  edits: NodesBatchEdit[]
  timezoneOffset?: number | null
  lang?: string | null
}

/**
 * Sends the edits record by record to the records update thread and collects the results.
 * @param {NodesBatchParams} params - The request.
 * @param {NodesBatchServiceDeps} deps - The dependencies.
 * @returns {Promise<NodesBatchEditResult[]>} One result per edit, sorted by index.
 */
const runNodesBatch = async (
  { user, surveyId, cycle, edits, timezoneOffset = null, lang = null }: NodesBatchParams,
  deps: NodesBatchServiceDeps
): Promise<NodesBatchEditResult[]> => {
  const context: RequestContext = {
    user,
    surveyId,
    cycle,
    timezoneOffset,
    lang,
    deadline: Date.now() + NodesBatchLimits.replyTimeoutMs,
    deps,
  }
  const results: NodesBatchEditResult[] = []
  // one record at a time: the thread has one queue, so the messages of a batch would delay the form edits of all
  // the users behind them
  for (const [recordUuid, recordEdits] of groupEditsByRecord(edits)) {
    // the request was reported as timed out: do not start more work
    results.push(
      ...(Date.now() >= context.deadline
        ? failedResults(recordEdits, NodesBatchMessageKeys.applyTimeout)
        : await sendRecordEditsSafely(context, recordUuid, recordEdits))
    )
  }
  return results.sort((resultA, resultB) => resultA.index - resultB.index)
}

/**
 * Waits for a batch, but not for ever: past the request deadline plus a grace time the caller gets a timeout error
 * (the work still running in the background stops by itself, as the deadline has passed).
 * @param {Promise<NodesBatchEditResult[]>} batch - The batch run.
 * @returns {Promise<NodesBatchEditResult[]>} The results of the batch.
 * @throws {SystemError} aiApplyTimeout (504) when the batch did not end in time.
 */
const runUntilHung = async (batch: Promise<NodesBatchEditResult[]>): Promise<NodesBatchEditResult[]> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const hung = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new SystemError(NodesBatchMessageKeys.applyTimeout, {}, GATEWAY_TIMEOUT)),
      NodesBatchLimits.replyTimeoutMs + SLOT_RELEASE_GRACE_MS
    )
  })
  // the batch may still fail after the timeout: nobody waits for it any more
  batch.catch(() => undefined)
  try {
    return await Promise.race([batch, hung])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Applies attribute value edits to published records (at most 200 edits on 50 records, see parseNodesBatchRequest);
 * the records update thread checks the permissions and the edits inside the record lock.
 * A user has one batch at a time, and a survey and the process a few: the others get a 429.
 * @param {NodesBatchParams} params - The request.
 * @param {object} params.user - The user.
 * @param {number} params.surveyId - The survey id.
 * @param {string} params.cycle - The survey cycle of the records.
 * @param {NodesBatchEdit[]} params.edits - The edits.
 * @param {number|null} [params.timezoneOffset] - The client timezone offset (for expressions using the current time).
 * @param {string|null} [params.lang] - The client language.
 * @param {NodesBatchServiceDeps} [deps] - The dependencies (tests).
 * @returns {Promise<NodesBatchEditResult[]>} One result per edit, sorted by index.
 */
export const updateNodesBatch = async (
  params: NodesBatchParams,
  deps: NodesBatchServiceDeps = createDefaultNodesBatchServiceDeps()
): Promise<NodesBatchEditResult[]> => {
  const slot = deps.slots.tryAcquire({ userUuid: User.getUuid(params.user), surveyId: params.surveyId })
  if (slot.ok === false) throw new SystemError(NodesBatchMessageKeys.busy, { scope: slot.scope }, TOO_MANY_REQUESTS)
  try {
    return await runUntilHung(runNodesBatch(params, deps))
  } finally {
    slot.release()
  }
}
