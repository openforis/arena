/**
 * Batch record edit (assistant record-edit change sets): permission checks per record, then one
 * nodesBatchPersist message per record to the records update thread, waiting for the replies.
 */
import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { uuidv4 } from '@core/uuid'

import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as NodeRepository from '@server/modules/record/repository/nodeRepository'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as Log from '@server/log/log'

import { RecordsUpdateThreadService } from '../surveyRecordsThreadService'
import { RecordsUpdateThreadMessageTypes } from '../thread/recordsThreadMessageTypes'
import { NodesBatchReplies, NodesBatchReplyRegistry } from './nodesBatchReplies'
import { groupEditsByRecord } from './nodesBatchRequest'
import {
  NodesBatchEdit,
  NodesBatchEditResult,
  NodesBatchLimits,
  NodesBatchMessageKeys,
  NodesBatchPersistMessage,
  NodesBatchRecordEdit,
  conflictResult,
  failedResult,
  failedResults,
} from './nodesBatchTypes'

const Logger = Log.getLogger('NodesBatchService')

export type NodesBatchServiceDeps = {
  fetchSurvey: (params: { surveyId: number; cycle: string }) => Promise<any>
  fetchQualifierFilters: (params: { user: any; survey: any }) => Promise<any>
  fetchRecord: (params: { surveyId: number; recordUuid: string }) => Promise<any | null>
  fetchNodeRecordUuid: (params: { surveyId: number; nodeUuid: string }) => Promise<string | null>
  recordMatchesQualifierFilters: (params: {
    survey: any
    record: any
    qualifierFilters: any
    pendingNode: any
    canEditQualifierValue: boolean
  }) => boolean
  postBatchMessage: (msg: NodesBatchPersistMessage) => void
  replies: NodesBatchReplyRegistry
  logError: (message: string) => void
}

type RequestContext = {
  user: any
  surveyId: number
  cycle: string
  timezoneOffset: number | null
  lang: string | null
  survey: any
  qualifierFilters: any
  canEditQualifierValue: boolean
  // one deadline for the whole request: the records are checked one after the other
  deadline: number
  deps: NodesBatchServiceDeps
}

/**
 * Creates the dependencies of the service (database, records update thread, reply channel).
 * @returns {NodesBatchServiceDeps} The dependencies.
 */
export const createDefaultNodesBatchServiceDeps = (): NodesBatchServiceDeps => ({
  fetchSurvey: ({ surveyId, cycle }) => SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle }),
  fetchQualifierFilters: ({ user, survey }) => SurveyManager.fetchUserQualifierFilters({ user, survey }),
  fetchRecord: ({ surveyId, recordUuid }) =>
    RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, fetchForUpdate: false, includeRefData: false }),
  fetchNodeRecordUuid: ({ surveyId, nodeUuid }) => NodeRepository.fetchNodeRecordUuid(surveyId, nodeUuid),
  recordMatchesQualifierFilters: (params) => RecordManager.recordMatchesQualifierFilters(params),
  postBatchMessage: (msg) => RecordsUpdateThreadService.getOrCreatedThread().postMessage(msg),
  replies: NodesBatchReplies,
  logError: (message) => Logger.error(message),
})

/**
 * Returns the record with its survey uuid (needed by the Authorizer), taken from the survey when missing.
 * @param {object} record - The record.
 * @param {object} survey - The survey.
 * @returns {object} The record.
 */
const withSurveyUuid = (record: any, survey: any) =>
  Record.getSurveyUuid(record)
    ? record
    : { ...record, [Record.keys.surveyUuid]: Survey.getUuid(Survey.getSurveyInfo(survey)) }

/**
 * Returns true when the record matches the user group qualifiers (optionally with a pending node value).
 * @param {RequestContext} context - The request context.
 * @param {object} record - The record.
 * @param {object|null} pendingNode - The node with its new value, or null.
 * @returns {boolean} Whether the record matches.
 */
const matchesQualifiers = (context: RequestContext, record: any, pendingNode: any): boolean =>
  context.deps.recordMatchesQualifierFilters({
    survey: context.survey,
    record,
    qualifierFilters: context.qualifierFilters,
    pendingNode,
    canEditQualifierValue: context.canEditQualifierValue,
  })

/**
 * Checks one edit of a permitted record before sending it to the thread.
 * @param {RequestContext} context - The request context.
 * @param {object} record - The record.
 * @param {NodesBatchRecordEdit} edit - The edit.
 * @returns {Promise<NodesBatchEditResult|null>} The result of a refused edit, or null when the edit can be sent.
 */
const checkEditBeforeSend = async (
  context: RequestContext,
  record: any,
  edit: NodesBatchRecordEdit
): Promise<NodesBatchEditResult | null> => {
  const node = Record.getNodeByUuid(edit.nodeUuid)(record)
  if (!node) {
    const nodeRecordUuid = await context.deps.fetchNodeRecordUuid({
      surveyId: context.surveyId,
      nodeUuid: edit.nodeUuid,
    })
    return nodeRecordUuid ? failedResult(edit.index, NodesBatchMessageKeys.nodeNotInRecord) : conflictResult(edit.index)
  }
  if (!matchesQualifiers(context, record, Node.assocValue(edit.to)(node))) {
    return failedResult(edit.index, NodesBatchMessageKeys.forbidden)
  }
  return null
}

/**
 * Checks a record and its edits: the refused edits get a result, the others are returned to be sent.
 * @param {RequestContext} context - The request context.
 * @param {string} recordUuid - The record uuid.
 * @param {NodesBatchRecordEdit[]} edits - The edits of the record.
 * @returns {Promise<{results: NodesBatchEditResult[], accepted: NodesBatchRecordEdit[]}>} The outcome.
 */
const checkRecordEdits = async (context: RequestContext, recordUuid: string, edits: NodesBatchRecordEdit[]) => {
  const recordDb = await context.deps.fetchRecord({ surveyId: context.surveyId, recordUuid })
  if (!recordDb || Record.getCycle(recordDb) !== context.cycle) {
    return { results: edits.map(({ index }) => conflictResult(index)), accepted: [] }
  }
  const record = withSurveyUuid(recordDb, context.survey)
  if (!Authorizer.canEditRecord(context.user, record) || !matchesQualifiers(context, record, null)) {
    return { results: failedResults(edits, NodesBatchMessageKeys.forbidden), accepted: [] }
  }
  const results: NodesBatchEditResult[] = []
  const accepted: NodesBatchRecordEdit[] = []
  for (const edit of edits) {
    const refused = await checkEditBeforeSend(context, record, edit)
    if (refused) {
      results.push(refused)
    } else {
      accepted.push(edit)
    }
  }
  return { results, accepted }
}

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
    deadline,
  })
  const results = await reply
  return results ?? failedResults(edits, NodesBatchMessageKeys.applyTimeout)
}

/**
 * Applies attribute value edits to published records (at most 200 edits on 50 records, see parseNodesBatchRequest).
 * @param {object} params - The parameters.
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
  {
    user,
    surveyId,
    cycle,
    edits,
    timezoneOffset = null,
    lang = null,
  }: {
    user: any
    surveyId: number
    cycle: string
    edits: NodesBatchEdit[]
    timezoneOffset?: number | null
    lang?: string | null
  },
  deps: NodesBatchServiceDeps = createDefaultNodesBatchServiceDeps()
): Promise<NodesBatchEditResult[]> => {
  const deadline = Date.now() + NodesBatchLimits.replyTimeoutMs
  const survey = await deps.fetchSurvey({ surveyId, cycle })
  const context: RequestContext = {
    user,
    surveyId,
    cycle,
    timezoneOffset,
    lang,
    survey,
    qualifierFilters: await deps.fetchQualifierFilters({ user, survey }),
    canEditQualifierValue: Authorizer.canEditQualifierAttributeValue(user, Survey.getSurveyInfo(survey)),
    deadline,
    deps,
  }
  const results: NodesBatchEditResult[] = []
  const pendingReplies: Promise<NodesBatchEditResult[]>[] = []
  for (const [recordUuid, recordEdits] of groupEditsByRecord(edits)) {
    try {
      const { results: refused, accepted } = await checkRecordEdits(context, recordUuid, recordEdits)
      results.push(...refused)
      if (accepted.length > 0) {
        pendingReplies.push(sendRecordEdits(context, recordUuid, accepted))
      }
    } catch (error) {
      // one record's failure must not hide the results of the others
      deps.logError(`error checking the batch edits of record ${recordUuid}: ${(error as Error)?.stack ?? error}`)
      results.push(...failedResults(recordEdits, NodesBatchMessageKeys.generic))
    }
  }
  for (const replyResults of await Promise.all(pendingReplies)) {
    results.push(...replyResults)
  }
  return results.sort((resultA, resultB) => resultA.index - resultB.index)
}
