import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'
import { z } from 'zod'

import { runAssistantTurn } from '@webapp/ai/agent/runAssistantTurn'
import type { ChangeSet } from '@webapp/ai/changeSets/types'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import type { Conversation } from '@webapp/ai/conversations/types'
import { withSuggestionScope } from '@webapp/ai/suggestions/suggestionConversation'
import type { AiTool, AiToolContext } from '@webapp/ai/tools/types'
import { createToolContext } from '@test/unit/utils/assistantTestUtils'

const usage = { inputTokens: { total: 1 }, outputTokens: { total: 1 } }
const finish = (unified: string) => ({ type: 'finish', finishReason: { unified, raw: undefined }, usage })

const textStream = (text: string): any =>
  convertArrayToReadableStream([
    { type: 'stream-start', warnings: [] },
    { type: 'text-start', id: 't' },
    { type: 'text-delta', id: 't', delta: text },
    { type: 'text-end', id: 't' },
    finish('stop'),
  ] as any[])

const toolCallStream = (toolCallId: string, toolName: string): any =>
  convertArrayToReadableStream([
    { type: 'stream-start', warnings: [] },
    { type: 'tool-call', toolCallId, toolName, input: JSON.stringify({ summary: toolName }) },
    finish('tool-calls'),
  ] as any[])

// one stream per model call, in order (the last one repeats)
const scriptedModel = (...streams: (() => any)[]) => {
  let call = 0
  return new MockLanguageModelV4({
    doStream: async () => ({ stream: streams[Math.min(call++, streams.length - 1)]() }) as any,
  })
}

const makeTool = (name: string, execute: AiTool['execute']): AiTool => ({
  name,
  description: `${name} tool`,
  inputSchema: z.object({ summary: z.string() }),
  area: ['design'],
  dataClass: 'schema',
  effect: 'read',
  requires: () => true,
  execute,
})

const cloudAccess = { effective: { schema: 'cloud', data: 'onDevice' } as any, hostingClass: 'cloud' as const }
const SCOPE = { kind: 'missingTranslations' as const, targetKeys: ['a:labels'] }
const changeSet = (id: string): ChangeSet => ({ id, surveyId: 7, summary: id, operations: [], createdAt: '' })

type Seen = { scope: AiToolContext['suggestionScope']; pending: string[] }

/**
 * Runs a turn where the model calls a propose tool, then a reader that records the context it sees.
 * @param {Conversation} conversation - Conversation before the turn.
 * @returns {Promise<{ result: Conversation, seen: Seen[] }>} The result and the recorded contexts.
 */
const runRecorded = async (conversation: Conversation) => {
  const seen: Seen[] = []
  const record = (ctx: AiToolContext) =>
    seen.push({ scope: ctx.suggestionScope, pending: (ctx.getPendingChangeSets?.() ?? []).map((item) => item.id) })
  const reader = makeTool('test_reader', async (_input, ctx) => {
    record(ctx)
    return { ok: true }
  })
  const propose = makeTool('test_propose', async (_input, ctx) => {
    ctx.onChangeSet(changeSet('new'))
    return { changeSetId: 'new' }
  })
  const model = scriptedModel(
    () => toolCallStream('call-1', 'test_reader'),
    () => toolCallStream('call-2', 'test_propose'),
    () => toolCallStream('call-3', 'test_reader'),
    () => textStream('Review the card.')
  )
  const result = await runAssistantTurn({
    conversation,
    userMessage: 'Translate',
    area: 'design',
    ctx: createToolContext(),
    access: cloudAccess,
    onUpdate: () => undefined,
    signal: new AbortController().signal,
    model,
    systemPrompt: 'SYSTEM',
    tools: [reader, propose],
  })
  return { result, seen }
}

describe('suggestion tool context (219)', () => {
  test('a Do it conversation gives its scope to the tools, and keeps it for a follow-up turn', async () => {
    const scoped = withSuggestionScope(createConversation({ userUuid: 'u1', surveyId: 7, area: 'design' }), SCOPE)
    const { result, seen } = await runRecorded(scoped)
    expect(seen.map((item) => item.scope)).toEqual([SCOPE, SCOPE])
    expect(result.suggestionScope).toEqual(SCOPE)
    const followUp = await runRecorded(result)
    expect(followUp.seen[0].scope).toEqual(SCOPE)
  })

  test('another conversation gives a null scope', async () => {
    const { seen } = await runRecorded(createConversation({ userUuid: 'u1', surveyId: 7, area: 'design' }))
    expect(seen.map((item) => item.scope)).toEqual([null, null])
  })

  test('pending change sets: earlier open cards and the ones of this turn; applied and discarded ones are not', async () => {
    const base = createConversation({ userUuid: 'u1', surveyId: 7, area: 'design' })
    const conversation: Conversation = {
      ...base,
      changeSets: {
        open: { changeSet: changeSet('open') },
        applied: { changeSet: changeSet('applied'), results: [] },
        discarded: { changeSet: changeSet('discarded'), discarded: true },
      },
    }
    const { seen } = await runRecorded(conversation)
    expect(seen.map((item) => item.pending)).toEqual([['open'], ['open', 'new']])
  })
})
