import { z } from 'zod'

import { APPLY_NOTE_PREFIX, buildHistory, describeToolPart, getHistoryBudget } from '@webapp/ai/agent/agentMessages'
import type { ConversationMessage, ConversationToolPart } from '@webapp/ai/conversations/types'
import type { AiTool } from '@webapp/ai/tools/types'

const createdAt = '2026-10-07T10:00:00.000Z'

const user = (id: string, text: string): ConversationMessage => ({ id, role: 'user', text, createdAt })

const assistant = (
  id: string,
  parts: any[],
  status: 'done' | 'stopped' | 'error' | 'streaming' = 'done'
): ConversationMessage => ({ id, role: 'assistant', parts, status, createdAt })

const text = (value: string) => ({ type: 'text', text: value })

const tool = (
  toolName: string,
  output: unknown,
  state: ConversationToolPart['state'] = 'done'
): ConversationToolPart => ({
  type: 'tool',
  toolCallId: `call-${toolName}`,
  toolName,
  input: {},
  output,
  state,
})

describe('describeToolPart', () => {
  test('counts, change sets, failures', () => {
    expect(describeToolPart(tool('nodeDef_search', { matches: [1, 2, 3] }))).toBe('[nodeDef_search returned 3 items]')
    expect(
      describeToolPart(tool('labels_proposeSet', { changeSetId: 'cs-1', operations: 2, status: 'shownToUser' }))
    ).toBe('[labels_proposeSet: change set cs-1 (2 operations) shown to the user]')
    expect(describeToolPart(tool('nodeDef_get', { error: { code: 'nodeDefNotFound', message: 'x' } }, 'failed'))).toBe(
      '[nodeDef_get failed: nodeDefNotFound]'
    )
    expect(describeToolPart(tool('view_getCurrent', { module: 'designer' }))).toBe('[view_getCurrent done]')
  })
})

describe('buildHistory', () => {
  test('plain text turns, the new message last', () => {
    const history = buildHistory({
      messages: [user('u1', 'Hi'), assistant('a1', [text('Hello!')])],
      userMessage: 'Add a field',
      budgetChars: 10000,
    })
    expect(history).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
      { role: 'user', content: 'Add a field' },
    ])
  })

  test('tool calls become notes inside the answer', () => {
    const history = buildHistory({
      messages: [
        user('u1', 'Find the tree attributes'),
        assistant('a1', [text('Looking.'), tool('nodeDef_search', { matches: [1, 2] }), text('Found two.')]),
      ],
      userMessage: 'Thanks',
      budgetChars: 10000,
    })
    expect(history[1]).toEqual({
      role: 'assistant',
      content: 'Looking.\n[nodeDef_search returned 2 items]\nFound two.',
    })
  })

  test('an apply note is a user message merged with the next user message', () => {
    const history = buildHistory({
      messages: [
        user('u1', 'Add remarks'),
        assistant('a1', [text('Proposed.')]),
        { id: 'n1', role: 'applyNote', text: 'Applied 1 of 1 operations.', changeSetId: 'cs-1', createdAt },
      ],
      userMessage: 'Now a label in French',
      budgetChars: 10000,
    })
    expect(history).toHaveLength(3)
    expect(history[2]).toEqual({
      role: 'user',
      content: `${APPLY_NOTE_PREFIX}Applied 1 of 1 operations.\n\nNow a label in French`,
    })
  })

  test('stopped answers keep their text; failed and empty answers are left out', () => {
    const history = buildHistory({
      messages: [
        user('u1', 'One'),
        assistant('a1', [text('Partial')], 'stopped'),
        user('u2', 'Two'),
        assistant('a2', [], 'error'),
        user('u3', 'Three'),
        assistant('a3', [text('')], 'done'),
      ],
      userMessage: 'Four',
      budgetChars: 10000,
    })
    expect(history).toEqual([
      { role: 'user', content: 'One' },
      { role: 'assistant', content: 'Partial\n[stopped by the user]' },
      { role: 'user', content: 'Two\n\nThree\n\nFour' },
    ])
  })

  test('the budget drops the oldest messages first and never starts with an answer', () => {
    const messages = [
      user('u1', 'a'.repeat(50)),
      assistant('a1', [text('b'.repeat(50))]),
      user('u2', 'c'.repeat(50)),
      assistant('a2', [text('d'.repeat(50))]),
    ]
    const history = buildHistory({ messages, userMessage: 'e'.repeat(50), budgetChars: 160 })
    expect(history.map((message) => (message.content as string)[0])).toEqual(['c', 'd', 'e'])
    const tiny = buildHistory({ messages, userMessage: 'e'.repeat(50), budgetChars: 10 })
    expect(tiny).toEqual([{ role: 'user', content: 'e'.repeat(50) }])
  })
})

describe('getHistoryBudget', () => {
  test('80 % of the prompt limit minus the system prompt and the tool schemas', () => {
    const echo: AiTool = {
      name: 'echo',
      description: 'Echo',
      inputSchema: z.object({ text: z.string() }),
      area: ['design'],
      dataClass: 'schema',
      effect: 'read',
      requires: () => true,
      execute: async () => null,
    }
    const withoutTools = getHistoryBudget({ maxPromptChars: 1000, systemPrompt: 'x'.repeat(100), tools: [] })
    expect(withoutTools).toBe(700)
    expect(getHistoryBudget({ maxPromptChars: 1000, systemPrompt: 'x'.repeat(100), tools: [echo] })).toBeLessThan(700)
    expect(getHistoryBudget({ maxPromptChars: 100, systemPrompt: 'x'.repeat(100), tools: [] })).toBe(0)
  })
})
