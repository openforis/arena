import * as Survey from '@core/survey/survey'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import SystemError from '@core/systemError'
import { parseNodeValueInput, type NodeValueInput, type ParsedNodeValue } from '@core/record/nodeValueParser'
import { areNodeValuesEqual } from '@core/record/nodeValueEquality'

import type { ChangeOperationDraft } from '@webapp/ai/changeSets/types'
import { RECORD_ATTRIBUTE_UPDATE } from '@webapp/ai/changeSets/recordEdits/types'

import type { CleaningApi } from './cleaningApi'
import { createRefDataProviders } from './refDataProviders'
import {
  checkAttributeEditable,
  checkNodeEditable,
  checkRecordEditable,
  type EditRefusal,
} from './recordEditPermissions'
import { computeRecordEditPreview } from './recordEditPreview'
import { describeNodePath, describeRecordKeys, formatNodeValue, getNodePage } from './recordNodeDescriber'
import type { CleaningI18n } from './validationRows'

export type RecordEditInput = { recordUuid: string; nodeUuid: string; value: NodeValueInput }

export type RecordEditRejection = { index: number; recordUuid: string; nodeUuid: string; code: string; message: string }

type IndexedEdit = RecordEditInput & { index: number }

type PreparedEdit = { index: number; node: any; parsed: ParsedNodeValue }

type Providers = ReturnType<typeof createRefDataProviders>

type ProposalContext = {
  api: CleaningApi
  i18n: CleaningI18n
  user: any
  survey: any
  surveyId: number
  cycle: string
  lang: string
  timezoneOffset: number
  signal?: AbortSignal
  providers: Providers
}

/**
 * Builds a rejection of an edit.
 * @param {IndexedEdit} edit - The edit.
 * @param {EditRefusal} refusal - Why it is refused.
 * @returns {RecordEditRejection} The rejection.
 */
const reject = (edit: IndexedEdit, { code, message }: EditRefusal): RecordEditRejection => ({
  index: edit.index,
  recordUuid: edit.recordUuid,
  nodeUuid: edit.nodeUuid,
  code,
  message,
})

/**
 * Groups the edits by record, keeping their index in the proposal.
 * @param {RecordEditInput[]} edits - The edits.
 * @returns {Map<string, IndexedEdit[]>} Edits by record uuid, in proposal order.
 */
const groupByRecord = (edits: RecordEditInput[]): Map<string, IndexedEdit[]> => {
  const groups = new Map<string, IndexedEdit[]>()
  for (const [index, edit] of edits.entries()) {
    const group = groups.get(edit.recordUuid) ?? []
    group.push({ ...edit, index })
    groups.set(edit.recordUuid, group)
  }
  return groups
}

/**
 * Parses the value of an edit; an invalid value becomes a refusal with the translated parser message.
 * @param {object} params - Parameters.
 * @param {ProposalContext} params.context - Proposal context.
 * @param {object} params.record - The record.
 * @param {object} params.node - The node.
 * @param {object} params.nodeDef - Its definition.
 * @param {NodeValueInput} params.value - The value written by the model.
 * @returns {Promise<{parsed?: ParsedNodeValue, refusal?: EditRefusal}>} The parsed value or the refusal.
 */
const parseEditValue = async ({
  context,
  record,
  node,
  nodeDef,
  value,
}: {
  context: ProposalContext
  record: any
  node: any
  nodeDef: any
  value: NodeValueInput
}): Promise<{ parsed?: ParsedNodeValue; refusal?: EditRefusal }> => {
  try {
    const parsed = await parseNodeValueInput({
      survey: context.survey,
      nodeDef,
      input: value,
      record,
      parentNode: Record.getParentNode(node)(record),
      currentValue: Node.getValue(node, null),
      ...context.providers,
    })
    return { parsed }
  } catch (error) {
    // a timeout of a ref-data lookup is not a wrong value: the tool reports it as such
    if (!(error instanceof SystemError) || error.key === 'queryTimeout') throw error
    return { refusal: { code: 'invalidValue', message: context.i18n.t(error.key, error.params) } }
  }
}

/**
 * Checks and parses one edit of a loaded record.
 * @param {object} params - Parameters.
 * @param {ProposalContext} params.context - Proposal context.
 * @param {object} params.record - The record.
 * @param {IndexedEdit} params.edit - The edit.
 * @param {Set<string>} params.seenNodeUuids - Nodes already edited in this proposal.
 * @returns {Promise<{prepared?: PreparedEdit, refusal?: EditRefusal}>} The prepared edit or the refusal.
 */
const prepareEdit = async ({
  context,
  record,
  edit,
  seenNodeUuids,
}: {
  context: ProposalContext
  record: any
  edit: IndexedEdit
  seenNodeUuids: Set<string>
}): Promise<{ prepared?: PreparedEdit; refusal?: EditRefusal }> => {
  if (seenNodeUuids.has(edit.nodeUuid)) {
    return {
      refusal: { code: 'duplicateEdit', message: 'This node is already edited in this proposal: one edit per node.' },
    }
  }
  seenNodeUuids.add(edit.nodeUuid)
  const node = Record.getNodeByUuid(edit.nodeUuid)(record)
  if (!node) {
    return {
      refusal: {
        code: 'nodeNotFound',
        message: 'No node with this UUID in the record: read it with record_getValues.',
      },
    }
  }
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(context.survey)
  const attributeRefusal = checkAttributeEditable({ user: context.user, survey: context.survey, nodeDef })
  if (attributeRefusal) return { refusal: attributeRefusal }
  const nodeRefusal = checkNodeEditable({ record, node, nodeDef })
  if (nodeRefusal) return { refusal: nodeRefusal }

  const { parsed, refusal } = await parseEditValue({ context, record, node, nodeDef, value: edit.value })
  if (refusal) return { refusal }
  if (areNodeValuesEqual(Node.getValue(node, null), parsed?.value)) {
    return { refusal: { code: 'noChange', message: 'The node already has this value.' } }
  }
  return { prepared: { index: edit.index, node, parsed: parsed as ParsedNodeValue } }
}

/**
 * Builds the operation drafts of the prepared edits of a record, with their preview.
 * @param {object} params - Parameters.
 * @param {ProposalContext} params.context - Proposal context.
 * @param {object} params.record - The record.
 * @param {PreparedEdit[]} params.prepared - Prepared edits.
 * @returns {Promise<ChangeOperationDraft[]>} The drafts, in proposal order.
 */
const buildRecordDrafts = async ({
  context,
  record,
  prepared,
}: {
  context: ProposalContext
  record: any
  prepared: PreparedEdit[]
}): Promise<ChangeOperationDraft[]> => {
  const { survey, cycle } = context
  const { recordAfter, previewByNodeUuid, recordNewErrors } = await computeRecordEditPreview({
    user: context.user,
    survey,
    record,
    edits: prepared.map(({ node, parsed }) => ({ node, value: parsed.value, refData: parsed.refData })),
    ...context.providers,
    timezoneOffset: context.timezoneOffset,
    lang: context.lang,
    i18n: context.i18n,
  })
  const recordKeys = describeRecordKeys({ survey, cycle, record })
  return prepared.map(({ node, parsed }) => {
    const nodeUuid = Node.getUuid(node)
    const nodeAfter = Record.getNodeByUuid(nodeUuid)(recordAfter)
    return {
      type: RECORD_ATTRIBUTE_UPDATE,
      recordUuid: Record.getUuid(record),
      cycle,
      nodeUuid,
      nodeDefUuid: Node.getNodeDefUuid(node),
      recordKeys,
      path: describeNodePath({ survey, cycle, record, node }),
      from: Node.getValue(node, null),
      to: parsed.value,
      preview: { ...previewByNodeUuid[nodeUuid], recordNewErrors },
      page: getNodePage({ record, node }),
      display: {
        from: formatNodeValue({ survey, cycle, node }),
        to: parsed.value === null ? null : formatNodeValue({ survey, cycle, node: nodeAfter }),
      },
    }
  })
}

const cycleRefusal: EditRefusal = {
  code: 'recordOfOtherCycle',
  message: 'This record belongs to another survey cycle than the one the user has open: it can not be edited here.',
}

/**
 * Proposes the edits of one record: loads it once, checks the permissions, parses and previews.
 * @param {object} params - Parameters.
 * @param {ProposalContext} params.context - Proposal context.
 * @param {string} params.recordUuid - Record uuid.
 * @param {IndexedEdit[]} params.edits - Its edits.
 * @returns {Promise<{drafts: ChangeOperationDraft[], rejected: RecordEditRejection[]}>} Drafts and rejections.
 */
const proposeRecordEdits = async ({
  context,
  recordUuid,
  edits,
}: {
  context: ProposalContext
  recordUuid: string
  edits: IndexedEdit[]
}) => {
  const record = await context.api.fetchRecordAndNodes({
    surveyId: context.surveyId,
    recordUuid,
    signal: context.signal,
  })
  const recordRefusal: EditRefusal | null = record
    ? checkRecordEditable({ user: context.user, survey: context.survey, record })
    : { code: 'recordNotAvailable', message: 'The record does not exist or you may not see it.' }
  if (recordRefusal) return { drafts: [], rejected: edits.map((edit) => reject(edit, recordRefusal)) }

  // a record of another cycle would be a conflict at Apply: say so now
  if (Record.getCycle(record) !== context.cycle) {
    return { drafts: [], rejected: edits.map((edit) => reject(edit, cycleRefusal)) }
  }

  const rejected: RecordEditRejection[] = []
  const prepared: PreparedEdit[] = []
  const seenNodeUuids = new Set<string>()
  for (const edit of edits) {
    const outcome = await prepareEdit({ context, record, edit, seenNodeUuids })
    if (outcome.refusal) rejected.push(reject(edit, outcome.refusal))
    else prepared.push(outcome.prepared as PreparedEdit)
  }
  const drafts = prepared.length > 0 ? await buildRecordDrafts({ context, record, prepared }) : []
  return { drafts, rejected }
}

/**
 * Turns the edits written by the model into record-edit operation drafts and rejections.
 * @param {object} params - Parameters (ProposalContext without providers, plus the edits).
 * @param {RecordEditInput[]} params.edits - The edits, at most RECORD_EDITS_MAX (checked by the tool).
 * @returns {Promise<{drafts: ChangeOperationDraft[], rejected: RecordEditRejection[]}>} Drafts and rejections (by index).
 */
export const buildRecordEditProposal = async ({
  edits,
  ...params
}: Omit<ProposalContext, 'providers'> & { edits: RecordEditInput[] }) => {
  const context: ProposalContext = {
    ...params,
    providers: createRefDataProviders({ api: params.api, surveyId: params.surveyId, signal: params.signal }),
  }
  const drafts: ChangeOperationDraft[] = []
  const rejected: RecordEditRejection[] = []
  for (const [recordUuid, recordEdits] of groupByRecord(edits)) {
    const outcome = await proposeRecordEdits({ context, recordUuid, edits: recordEdits })
    drafts.push(...outcome.drafts)
    rejected.push(...outcome.rejected)
  }
  rejected.sort((rejectionA, rejectionB) => rejectionA.index - rejectionB.index)
  return { drafts, rejected }
}
