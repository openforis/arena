import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'
import { z } from 'zod'

import { runAssistantTurn } from '@webapp/ai/agent/runAssistantTurn'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import type { Conversation } from '@webapp/ai/conversations/types'
import {
  categoryItemRefsRegistry,
  createCategoryItemRefs,
  createCategoryItemRefsRegistry,
  CATEGORY_ITEM_REFS_MAX_ENTRIES,
} from '@webapp/ai/tools/design/categoryItemRefs'
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

const KEY = { surveyId: 7, categoryUuid: 'cat-1', ref: '2.14' }
const ENTRY = { itemUuid: 'item-2.14', levelName: 'species', labels: { en: 'Pinus nigra' } }
const cloudAccess = { effective: { schema: 'cloud', data: 'onDevice' } as any, hostingClass: 'cloud' as const }

/**
 * Runs a turn where the model calls one tool, which gets the turn's context.
 * @param {Conversation} conversation - Conversation.
 * @param {Function} withCtx - Called with the tool context.
 * @returns {Promise<Conversation>} The conversation after the turn.
 */
const runWithTool = (conversation: Conversation, withCtx: (ctx: AiToolContext) => void): Promise<Conversation> => {
  const probe: AiTool = {
    name: 'test_probe',
    description: 'probe',
    inputSchema: z.object({ summary: z.string() }),
    area: ['design'],
    dataClass: 'schema',
    effect: 'read',
    requires: () => true,
    execute: async (_input, ctx) => {
      withCtx(ctx)
      return { ok: true }
    },
  }
  return runAssistantTurn({
    conversation,
    userMessage: 'Translate',
    area: 'design',
    ctx: createToolContext(),
    access: cloudAccess,
    onUpdate: () => undefined,
    signal: new AbortController().signal,
    model: scriptedModel(
      () => toolCallStream('call-1', 'test_probe'),
      () => textStream('Done.')
    ),
    systemPrompt: 'SYSTEM',
    tools: [probe],
  })
}

const newConversation = () => createConversation({ userUuid: 'u1', surveyId: 7, area: 'design' })

describe('category item refs (232)', () => {
  beforeEach(() => categoryItemRefsRegistry.clearAll())

  test('refs persist per conversation and survive another turn; another conversation does not see them', async () => {
    const conversation = newConversation()
    const afterFirst = await runWithTool(conversation, (ctx) =>
      ctx.categoryItemRefs?.register({ ...KEY, entry: ENTRY })
    )
    let seen: unknown = 'not called'
    await runWithTool(afterFirst, (ctx) => {
      seen = ctx.categoryItemRefs?.get(KEY)
    })
    expect(seen).toEqual(ENTRY)
    await runWithTool(newConversation(), (ctx) => {
      seen = ctx.categoryItemRefs?.get(KEY)
    })
    expect(seen).toBeNull()
  })

  test('clearAll drops the refs of every conversation', () => {
    const refs = categoryItemRefsRegistry.forConversation('c1')
    refs.register({ ...KEY, entry: ENTRY })
    categoryItemRefsRegistry.clearAll()
    expect(categoryItemRefsRegistry.forConversation('c1').get(KEY)).toBeNull()
  })

  test('a ref is bound to its survey and category', () => {
    const refs = createCategoryItemRefs()
    refs.register({ ...KEY, entry: ENTRY })
    expect(refs.get(KEY)).toEqual(ENTRY)
    expect(refs.get({ ...KEY, surveyId: 8 })).toBeNull()
    expect(refs.get({ ...KEY, categoryUuid: 'cat-2' })).toBeNull()
    refs.register({ ...KEY, entry: { ...ENTRY, labels: { en: 'Pinus nigra', fr: 'Pin noir' } } })
    expect(refs.get(KEY)?.labels.fr).toBe('Pin noir')
  })

  test('keeps the most recently used conversations and the latest entries', () => {
    const registry = createCategoryItemRefsRegistry(2)
    registry.forConversation('a').register({ ...KEY, entry: ENTRY })
    registry.forConversation('b')
    // using a makes b the oldest
    registry.forConversation('a')
    registry.forConversation('c')
    expect(registry.forConversation('a').get(KEY)).toEqual(ENTRY)
    expect(registry.forConversation('b').get(KEY)).toBeNull()

    const refs = createCategoryItemRefs()
    for (let index = 0; index <= CATEGORY_ITEM_REFS_MAX_ENTRIES; index += 1) {
      refs.register({ ...KEY, ref: String(index), entry: ENTRY })
    }
    expect(refs.get({ ...KEY, ref: '0' })).toBeNull()
    expect(refs.get({ ...KEY, ref: String(CATEGORY_ITEM_REFS_MAX_ENTRIES) })).toEqual(ENTRY)
  })
})
