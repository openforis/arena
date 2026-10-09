import { createConversation } from '@webapp/ai/conversations/conversationModel'
import type { AssistantMessage, Conversation, ConversationToolPart } from '@webapp/ai/conversations/types'
import {
  DISCARD_NOTE,
  getProposedChangeSetId,
  getRetryBase,
  getToolRowLabel,
  mergeOperationResults,
  normalizeLoadedConversation,
  withApplyResults,
  withDiscarded,
} from '@webapp/components/ai/Assistant/assistantPanelModel'

const createdAt = '2026-10-06T10:00:00.000Z'

const labels: Record<string, string> = {
  'aiAssistant.tools.nodeDef_get': 'Looked up {{name}}',
  'aiAssistant.tools.docs_search': 'Searched the manual for "{{query}}"',
  'aiAssistant.tools.view_getCurrent': 'Checked the current view',
  'aiAssistant.tools.default': 'Used a tool',
}

// like i18next: a missing key comes back unchanged
const t = (key: string, params: Record<string, unknown> = {}): string =>
  key in labels ? labels[key].replace(/\{\{(\w+)\}\}/g, (_match, name) => String(params[name])) : key

const toolPart = (toolName: string, input: unknown, output?: unknown): ConversationToolPart => ({
  type: 'tool',
  toolCallId: `call-${toolName}`,
  toolName,
  input,
  output,
  state: output === undefined ? 'running' : 'done',
})

const answer = (status: AssistantMessage['status'], text: string): AssistantMessage => ({
  id: `a-${status}`,
  role: 'assistant',
  parts: text ? [{ type: 'text', text }] : [],
  status,
  createdAt,
})

const conversationWith = (messages: Conversation['messages']): Conversation => ({
  ...createConversation({
    userUuid: 'u1',
    surveyId: 1,
    area: 'design',
    now: new Date(createdAt),
    idFactory: () => 'c1',
  }),
  messages,
})

const changeSet = { id: 'cs-1', surveyId: 1, summary: 'Labels', operations: [], createdAt }

describe('assistant panel model', () => {
  test('tool row labels', () => {
    expect(getToolRowLabel(toolPart('nodeDef_get', { name: 'tree_dec_1' }), t)).toBe('Looked up tree_dec_1')
    expect(getToolRowLabel(toolPart('docs_search', { query: 'publish survey' }), t)).toBe(
      'Searched the manual for "publish survey"'
    )
    expect(getToolRowLabel(toolPart('view_getCurrent', {}), t)).toBe('Checked the current view')
    expect(getToolRowLabel(toolPart('data_runQuery', { name: 'x' }), t)).toBe('Used a tool')
  })

  test('proposed change set of a tool row', () => {
    expect(getProposedChangeSetId(toolPart('labels_proposeSet', {}, { changeSetId: 'cs-1', operations: 1 }))).toBe(
      'cs-1'
    )
    expect(getProposedChangeSetId(toolPart('labels_proposeSet', {}))).toBeNull()
    expect(getProposedChangeSetId(toolPart('labels_proposeSet', {}, { error: { code: 'invalidProposal' } }))).toBeNull()
  })

  test('retry drops the failed pair and resends the user message', () => {
    const first = { id: 'u-1', role: 'user' as const, text: 'Add remarks', createdAt }
    const second = { id: 'u-2', role: 'user' as const, text: 'Now a label', createdAt }
    const failed = conversationWith([first, answer('done', 'Done.'), second, answer('error', '')])
    const retry = getRetryBase(failed)
    expect(retry?.text).toBe('Now a label')
    expect(retry?.base.messages.map((message) => message.id)).toEqual(['u-1', 'a-done'])
    expect(getRetryBase(conversationWith([first, answer('done', 'Done.')]))).toBeNull()
    expect(getRetryBase(conversationWith([]))).toBeNull()
  })

  test('operation results: the latest result of an operation wins', () => {
    const merged = mergeOperationResults(
      [
        { id: 'op-1', status: 'conflict', message: 'valueChanged' },
        { id: 'op-2', status: 'applied' },
      ],
      [{ id: 'op-1', status: 'applied' }]
    )
    expect(merged).toEqual([
      { id: 'op-1', status: 'applied' },
      { id: 'op-2', status: 'applied' },
    ])
  })

  test('apply results and discard are stored with a note for the model', () => {
    const conversation = { ...conversationWith([]), changeSets: { 'cs-1': { changeSet } } }
    const applied = withApplyResults({
      conversation,
      changeSetId: 'cs-1',
      results: [{ id: 'op-1', status: 'applied' }],
      note: 'Applied 1 of 1 operations.',
      now: createdAt,
      idFactory: () => 'n1',
    })
    expect(applied.changeSets['cs-1'].results).toEqual([{ id: 'op-1', status: 'applied' }])
    expect(applied.messages).toEqual([
      { id: 'n1', role: 'applyNote', text: 'Applied 1 of 1 operations.', changeSetId: 'cs-1', createdAt },
    ])
    const discarded = withDiscarded({
      conversation: applied,
      changeSetId: 'cs-1',
      now: createdAt,
      idFactory: () => 'n2',
    })
    expect(discarded.changeSets['cs-1'].discarded).toBe(true)
    expect(discarded.messages.at(-1)).toEqual({
      id: 'n2',
      role: 'applyNote',
      text: DISCARD_NOTE,
      changeSetId: 'cs-1',
      createdAt,
    })
    expect(withDiscarded({ conversation, changeSetId: 'missing' })).toBe(conversation)
  })
})

describe('loaded conversations', () => {
  test('an answer left streaming is shown as stopped, unless its turn is running', () => {
    const user = { id: 'u-1', role: 'user' as const, text: 'Hi', createdAt }
    const loaded = conversationWith([user, answer('streaming', 'Par'), answer('done', 'Ok')])
    const normalized = normalizeLoadedConversation(loaded)
    expect(
      normalized.messages.map((message) => (message.role === 'assistant' ? message.status : message.role))
    ).toEqual(['user', 'stopped', 'done'])
    expect(normalizeLoadedConversation(loaded, true)).toBe(loaded)
    const clean = conversationWith([user, answer('done', 'Ok')])
    expect(normalizeLoadedConversation(clean)).toBe(clean)
  })
})
