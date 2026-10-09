/**
 * Applies the edits of one record inside the record lock (see RecordsUpdateThread.processNodesBatchPersistMsg).
 */
import { Objects } from '@openforis/arena-core'
import { WebSocketEvent } from '@openforis/arena-server'

import SystemError from '@core/systemError'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'

import * as Log from '@server/log/log'

import { checkBatchEdit, findUniquenessErrorKey } from './nodesBatchEditCheck'
import {
  NodesBatchEditResult,
  NodesBatchMessageKeys,
  NodesBatchPersistMessage,
  NodesBatchRecordEdit,
  appliedResult,
  NodesBatchEditStatus,
  conflictResult,
  failedResult,
  failedResults,
} from './nodesBatchTypes'

const Logger = Log.getLogger('NodesBatchProcessor')

// thrown by acquireRecordLockAndRun (records update thread) when the record stays locked for too long
const lockTimeoutErrorKey = 'record.lockTimeout'
const maxErrorTextLength = 200

type ThreadMessage = { type: string; content: unknown }

export type NodesBatchProcessorDeps = {
  getSurvey: (msg: NodesBatchPersistMessage) => Promise<any>
  runWithRecordLock: <T>(recordUuid: string, fn: (t: any) => Promise<T>) => Promise<T>
  getOrFetchRecord: (params: { msg: NodesBatchPersistMessage; recordUuid: string; t: any }) => Promise<any | null>
  // uuid of the record owning the node, or null when the node does not exist (in any record)
  findNodeRecordUuid: (params: { msg: NodesBatchPersistMessage; nodeUuid: string; t: any }) => Promise<string | null>
  persistNode: (params: Record<string, unknown>, t: any) => Promise<any>
  cacheRecord: (params: { msg: NodesBatchPersistMessage; recordUuid: string; record: any; t: any }) => Promise<void>
  clearCachedRecord: (params: { msg: NodesBatchPersistMessage; recordUuid: string }) => Promise<void>
  postMessage: (message: ThreadMessage) => void
}

type BatchState = {
  msg: NodesBatchPersistMessage
  deps: NodesBatchProcessorDeps
  survey: any
  // results of the edits refused by the check (conflicts, not editable): kept when the record rolls back
  refusedResults: NodesBatchEditResult[]
  appliedEdits: NodesBatchRecordEdit[]
  // socket events, posted only after the transaction commits
  events: ThreadMessage[]
}

/**
 * Keeps the primitive error params only (they go to the client and through the worker message channel).
 * @param {object} params - The error params.
 * @returns {object|undefined} The primitive params, or undefined when there are none.
 */
const toMessageParams = (params: unknown): Record<string, unknown> | undefined => {
  if (!params || typeof params !== 'object') return undefined
  const entries = Object.entries(params).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

/**
 * Maps an error to the message key and params of the failed edits.
 * @param {unknown} error - The error.
 * @returns {{messageKey: string, params?: object}} The message.
 */
const toFailureMessage = (error: any): { messageKey: string; params?: Record<string, unknown> } => {
  const key = error?.key
  if (typeof key !== 'string') {
    const text = String(error?.message ?? error).slice(0, maxErrorTextLength)
    return { messageKey: NodesBatchMessageKeys.generic, params: { text } }
  }
  if (key === lockTimeoutErrorKey) {
    return { messageKey: NodesBatchMessageKeys.lockTimeout, params: toMessageParams(error.params) }
  }
  // keys thrown without a namespace are application errors (webapp convention: appErrors:<key>)
  const messageKey = key.includes(':') ? key : `appErrors:${key}`
  return { messageKey, params: toMessageParams(error.params) }
}

/**
 * Builds the nodesUpdate socket event (same content as RecordsUpdateThread.handleNodesUpdated).
 * @param {string} recordUuid - The record uuid.
 * @param {object} updatedNodes - The updated nodes by uuid.
 * @returns {ThreadMessage} The event.
 */
const nodesUpdateEvent = (recordUuid: string, updatedNodes: unknown): ThreadMessage => ({
  type: WebSocketEvent.nodesUpdate,
  content: { recordUuid, updatedNodes },
})

/**
 * Builds the nodeValidationsUpdate socket event (same content as RecordsUpdateThread.handleNodesValidationUpdated).
 * @param {object} record - The record before the update.
 * @param {object} validations - The node validations.
 * @returns {ThreadMessage} The event.
 */
const validationsUpdateEvent = (record: any, validations: any): ThreadMessage => ({
  type: WebSocketEvent.nodeValidationsUpdate,
  content: {
    recordUuid: Record.getUuid(record),
    recordValid: Validation.isObjValid(Record.mergeNodeValidations(validations)(record)),
    validations,
  },
})

/**
 * Persists one checked edit; throws when the new value duplicates a record key or a unique attribute of another record.
 * @param {object} params - The parameters.
 * @param {BatchState} params.state - The batch state.
 * @param {object} params.record - The current record.
 * @param {object} params.node - The node to update.
 * @param {NodesBatchRecordEdit} params.edit - The edit.
 * @param {object} params.t - The transaction.
 * @returns {Promise<object>} The updated record.
 */
const persistEdit = async ({
  state,
  record,
  node,
  edit,
  t,
}: {
  state: BatchState
  record: any
  node: any
  edit: NodesBatchRecordEdit
  t: any
}) => {
  const { msg, deps, survey, events } = state
  const recordUuid = Record.getUuid(record)
  let uniquenessErrorKey: string | null = null
  const recordUpdated = await deps.persistNode(
    {
      user: msg.user,
      survey,
      record,
      node: Node.assocValue(edit.to)(node),
      timezoneOffset: msg.timezoneOffset,
      lang: msg.lang,
      nodesUpdateListener: (updatedNodes: unknown) => {
        if (!Objects.isEmpty(updatedNodes)) events.push(nodesUpdateEvent(recordUuid, updatedNodes))
      },
      nodesValidationListener: (validations: unknown) => {
        uniquenessErrorKey ??= findUniquenessErrorKey({ validation: validations, nodeUuid: edit.nodeUuid })
        events.push(validationsUpdateEvent(record, validations))
      },
    },
    t
  )
  // the update manager only records duplicates as validation errors: a batch edit must not create them
  if (uniquenessErrorKey) throw new SystemError(uniquenessErrorKey)
  return recordUpdated
}

/**
 * Refines the conflict of an edit whose node is missing from the record: a node that belongs to another record
 * is a failure (never a conflict), so an edit can't be used to probe or touch the nodes of other records.
 * @param {object} params - The parameters.
 * @param {BatchState} params.state - The batch state.
 * @param {object} params.record - The current record.
 * @param {NodesBatchRecordEdit} params.edit - The edit.
 * @param {NodesBatchEditResult} params.result - The result given by the check.
 * @param {object} params.t - The transaction.
 * @returns {Promise<NodesBatchEditResult>} The result to keep.
 */
const refineMissingNodeResult = async ({
  state,
  record,
  edit,
  result,
  t,
}: {
  state: BatchState
  record: any
  edit: NodesBatchRecordEdit
  result: NodesBatchEditResult
  t: any
}): Promise<NodesBatchEditResult> => {
  const { msg, deps } = state
  const nodeMissing = result.status === NodesBatchEditStatus.conflict && !Record.getNodeByUuid(edit.nodeUuid)(record)
  if (!nodeMissing) return result
  const nodeRecordUuid = await deps.findNodeRecordUuid({ msg, nodeUuid: edit.nodeUuid, t })
  return nodeRecordUuid && nodeRecordUuid !== msg.recordUuid
    ? failedResult(edit.index, NodesBatchMessageKeys.nodeNotInRecord)
    : result
}

/**
 * Checks and persists the edits of the record, inside the record lock.
 * @param {BatchState} state - The batch state.
 * @param {object} t - The transaction.
 * @returns {Promise<NodesBatchEditResult[]>} The results.
 */
const applyEditsInLock = async (state: BatchState, t: any): Promise<NodesBatchEditResult[]> => {
  const { msg, deps, survey, refusedResults, appliedEdits } = state
  const { recordUuid, edits } = msg
  let record = await deps.getOrFetchRecord({ msg, recordUuid, t })
  if (!record) return edits.map(({ index }) => conflictResult(index))

  for (const edit of edits) {
    const check = checkBatchEdit({ survey, record, recordUuid, edit })
    if (check.ok === false) {
      refusedResults.push(await refineMissingNodeResult({ state, record, edit, result: check.result, t }))
    } else {
      record = await persistEdit({ state, record, node: check.node, edit, t })
      appliedEdits.push(edit)
    }
  }
  if (appliedEdits.length > 0) {
    await deps.cacheRecord({ msg, recordUuid, record, t })
  }
  return [...refusedResults, ...appliedEdits.map(({ index }) => appliedResult(index))]
}

/**
 * Builds the results of a record whose transaction rolled back: refused edits keep their result, the others fail.
 * @param {BatchState} state - The batch state.
 * @param {unknown} error - The error.
 * @returns {NodesBatchEditResult[]} The results.
 */
const rolledBackResults = (state: BatchState, error: unknown): NodesBatchEditResult[] => {
  const { messageKey, params } = toFailureMessage(error)
  const refusedIndexes = new Set(state.refusedResults.map(({ index }) => index))
  const failedEdits = state.msg.edits.filter(({ index }) => !refusedIndexes.has(index))
  return [...state.refusedResults, ...failedResults(failedEdits, messageKey, params)]
}

/**
 * Drops the cached record after a rollback (its in-memory copy may hold the rolled back values).
 * @param {BatchState} state - The batch state.
 * @returns {Promise<void>} Resolved when done.
 */
const clearCachedRecordSafely = async (state: BatchState): Promise<void> => {
  try {
    await state.deps.clearCachedRecord({ msg: state.msg, recordUuid: state.msg.recordUuid })
  } catch (error) {
    Logger.error(`error clearing the cached record ${state.msg.recordUuid}: ${error}`)
  }
}

/**
 * Sorts results by edit index.
 * @param {NodesBatchEditResult[]} results - The results.
 * @returns {NodesBatchEditResult[]} The sorted results.
 */
const sortByIndex = (results: NodesBatchEditResult[]): NodesBatchEditResult[] =>
  [...results].sort((resultA, resultB) => resultA.index - resultB.index)

/**
 * Applies the edits of one record: conflict check per edit, persist in one transaction, events after commit.
 * @param {object} params - The parameters.
 * @param {NodesBatchPersistMessage} params.msg - The thread message.
 * @param {NodesBatchProcessorDeps} params.deps - The thread dependencies.
 * @returns {Promise<NodesBatchEditResult[]>} One result per edit, sorted by index. Never throws.
 */
export const processNodesBatch = async ({
  msg,
  deps,
}: {
  msg: NodesBatchPersistMessage
  deps: NodesBatchProcessorDeps
}): Promise<NodesBatchEditResult[]> => {
  const state: BatchState = { msg, deps, survey: null, refusedResults: [], appliedEdits: [], events: [] }
  try {
    state.survey = await deps.getSurvey(msg)
    const results = await deps.runWithRecordLock(msg.recordUuid, (t) => applyEditsInLock(state, t))
    for (const event of state.events) {
      deps.postMessage(event)
    }
    if (state.appliedEdits.length > 0) {
      deps.postMessage({ type: WebSocketEvent.nodesUpdateCompleted, content: { recordUuid: msg.recordUuid } })
    }
    return sortByIndex(results)
  } catch (error) {
    if (typeof (error as any)?.key !== 'string') {
      Logger.error(`error applying the batch edits of record ${msg.recordUuid}: ${(error as Error)?.stack ?? error}`)
    }
    await clearCachedRecordSafely(state)
    return sortByIndex(rolledBackResults(state, error))
  }
}
