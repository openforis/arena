import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'
import { z } from 'zod'

import { unknownUsageV4 } from '@common/ai/sseParser'

import { buildHistory, buildTrimmedHistory, getToolDefinitionChars } from '@webapp/ai/agent/agentMessages'
import { runAssistantTurn } from '@webapp/ai/agent/runAssistantTurn'
import { buildTurnUsage, estimateContextTokens, toContextTokens } from '@webapp/ai/agent/turnUsage'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import type { AssistantMessage, Conversation, ConversationMessage } from '@webapp/ai/conversations/types'
import type { AiTool } from '@webapp/ai/tools/types'
import { createToolContext } from '@test/unit/utils/assistantTestUtils'

const usageOf = (input: number | undefined, output: number | undefined) => ({
  inputTokens: { total: input, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: output, text: undefined, reasoning: undefined },
})

const finish = (unified: string, usage: unknown) => ({
  type: 'finish',
  finishReason: { unified, raw: undefined },
  usage,
})

const textStream =
  (text: string, usage: unknown = usageOf(1, 1)) =>
  (): any =>
    convertArrayToReadableStream([
      { type: 'stream-start', warnings: [] },
      { type: 'text-start', id: 't' },
      { type: 'text-delta', id: 't', delta: text },
      { type: 'text-end', id: 't' },
      finish('stop', usage),
    ] as any[])

const toolCallStream =
  (toolName: string, usage: unknown): (() => any) =>
  () =>
    convertArrayToReadableStream([
      { type: 'stream-start', warnings: [] },
      { type: 'tool-call', toolCallId: 'call-1', toolName, input: JSON.stringify({ summary: 'a' }) },
      finish('tool-calls', usage),
    ] as any[])

const scriptedModel = (...streams: (() => any)[]) => {
  let call = 0
  return new MockLanguageModelV4({
    doStream: async () => ({ stream: streams[Math.min(call++, streams.length - 1)]() }) as any,
  })
}

const echo: AiTool = {
  name: 'test_echo',
  description: 'test_echo tool',
  inputSchema: z.object({ summary: z.string() }),
  area: ['design'],
  dataClass: 'schema',
  requires: () => true,
  execute: async () => ({ ok: true }),
}

const cloudAccess = { effective: { schema: 'cloud', data: 'onDevice' } as any, hostingClass: 'cloud' as const }

const USER_MESSAGE = 'Add a remarks field'
// the estimate of a turn without history and tools: ceil(('SYSTEM' + USER_MESSAGE).length / 3) = ceil(25 / 3)
const FRESH_ESTIMATE = 9

const run = ({
  model,
  conversation = createConversation({ userUuid: 'user-1', surveyId: 7, area: 'design' }),
  tools = [],
  limits,
  extra = {},
}: {
  model?: MockLanguageModelV4
  conversation?: Conversation
  tools?: AiTool[]
  limits?: { maxPromptChars: number; maxSteps: number }
  extra?: Partial<Parameters<typeof runAssistantTurn>[0]>
}) =>
  runAssistantTurn({
    conversation,
    userMessage: USER_MESSAGE,
    area: 'design',
    ctx: createToolContext(),
    access: cloudAccess,
    onUpdate: () => {},
    signal: new AbortController().signal,
    model,
    limits,
    ...extra,
    systemPrompt: 'SYSTEM',
    tools,
  })

const answerOf = (conversation: Conversation): AssistantMessage => conversation.messages.at(-1) as AssistantMessage

let nextId = 0
const userMsg = (text: string): ConversationMessage => ({
  id: `u${nextId++}`,
  role: 'user',
  text,
  createdAt: '2026-10-10T10:00:00.000Z',
})
const answerMsg = (text: string): ConversationMessage => ({
  id: `a${nextId++}`,
  role: 'assistant',
  parts: [{ type: 'text', text }],
  status: 'done',
  createdAt: '2026-10-10T10:00:00.000Z',
})

describe('turn usage (204)', () => {
  test('toContextTokens: input plus output; no input count is no usage', () => {
    expect(toContextTokens({ inputTokens: 300, outputTokens: 20 })).toBe(320)
    expect(toContextTokens({ inputTokens: 300 })).toBe(300)
    expect(toContextTokens({ inputTokens: 0, outputTokens: 5 })).toBeNull()
    expect(toContextTokens({ inputTokens: Number.NaN, outputTokens: 5 })).toBeNull()
    expect(toContextTokens({})).toBeNull()
    expect(toContextTokens(undefined)).toBeNull()
  })

  test('estimateContextTokens: system prompt, tool definitions and history, 3 characters per token', () => {
    const messages = [{ role: 'user' as const, content: 'x'.repeat(20) }]
    expect(estimateContextTokens({ systemPrompt: 'S'.repeat(10), tools: [], messages })).toBe(10)
    expect(estimateContextTokens({ systemPrompt: 'S'.repeat(10), tools: [echo], messages })).toBe(
      Math.ceil((30 + getToolDefinitionChars([echo])) / 3)
    )
    expect(getToolDefinitionChars([])).toBe(0)
  })

  test('buildTrimmedHistory counts the dropped messages; buildHistory returns the same messages', () => {
    const messages = [
      userMsg('a'.repeat(50)),
      answerMsg('b'.repeat(50)),
      userMsg('c'.repeat(50)),
      answerMsg('d'.repeat(50)),
    ]
    const userMessage = 'e'.repeat(50)
    expect(buildTrimmedHistory({ messages, userMessage, budgetChars: 10000 }).droppedCount).toBe(0)
    const trimmed = buildTrimmedHistory({ messages, userMessage, budgetChars: 160 })
    expect(trimmed.droppedCount).toBe(2)
    expect(trimmed.messages).toEqual(buildHistory({ messages, userMessage, budgetChars: 160 }))
    // the kept answer can't start the history: it is dropped too
    expect(buildTrimmedHistory({ messages, userMessage, budgetChars: 110 }).droppedCount).toBe(4)
  })

  test('buildTurnUsage: the step tokens, or the estimate marked as estimated', () => {
    const contextWindow = { tokens: 8192, assumed: true }
    expect(buildTurnUsage({ stepTokens: 500, estimatedTokens: 9, droppedCount: 0, contextWindow })).toEqual({
      contextTokens: 500,
      windowTokens: 8192,
      windowAssumed: true,
      estimated: false,
      historyTrimmed: false,
    })
    expect(buildTurnUsage({ stepTokens: null, estimatedTokens: 9, droppedCount: 3, contextWindow: null })).toEqual({
      contextTokens: 9,
      windowTokens: null,
      windowAssumed: false,
      estimated: true,
      historyTrimmed: true,
    })
  })

  test('the last finish-step wins', async () => {
    const model = scriptedModel(toolCallStream('test_echo', usageOf(100, 10)), textStream('Done.', usageOf(300, 20)))
    const result = await run({ model, tools: [echo] })
    expect(answerOf(result).usage).toEqual({
      contextTokens: 320,
      windowTokens: null,
      windowAssumed: false,
      estimated: false,
      historyTrimmed: false,
    })
  })

  test('missing or zero usage is estimated, never 0 tokens (review focus 1)', async () => {
    const unknown = await run({ model: scriptedModel(textStream('ok', unknownUsageV4())) })
    expect(answerOf(unknown).usage).toMatchObject({ contextTokens: FRESH_ESTIMATE, estimated: true })
    const zeros = await run({ model: scriptedModel(textStream('ok', usageOf(0, 0))) })
    expect(answerOf(zeros).usage).toMatchObject({ contextTokens: FRESH_ESTIMATE, estimated: true })
  })

  test('historyTrimmed when older messages are left out', async () => {
    const conversation = {
      ...createConversation({ userUuid: 'user-1', surveyId: 7, area: 'design' }),
      messages: [userMsg('x'.repeat(100)), answerMsg('y'.repeat(100))],
    }
    const model = scriptedModel(textStream('ok'))
    const result = await run({ model, conversation, limits: { maxPromptChars: 100, maxSteps: 2 } })
    expect(answerOf(result).usage?.historyTrimmed).toBe(true)
    // only the system prompt and the new message were sent
    expect(model.doStreamCalls[0].prompt).toHaveLength(2)

    const untrimmed = await run({ model: scriptedModel(textStream('ok')), conversation })
    expect(answerOf(untrimmed).usage?.historyTrimmed).toBe(false)
  })

  test('the window of the selected engine is stored', async () => {
    const model = scriptedModel(textStream('ok', usageOf(1000, 24)))
    const engine: any = {
      id: 'localServer',
      hostingClass: 'onDevice',
      label: 'LM Studio',
      model: 'local-model',
      limits: { maxPromptChars: 5000, maxSteps: 2 },
      contextWindow: { tokens: 8192, assumed: true },
    }
    const result = await run({
      extra: { resolve: async () => ({ model, engine, policy: { schema: 'onDevice', data: 'onDevice' } as const }) },
    })
    expect(answerOf(result).usage).toEqual({
      contextTokens: 1024,
      windowTokens: 8192,
      windowAssumed: true,
      estimated: false,
      historyTrimmed: false,
    })
  })

  test('a turn that fails after the request still has an estimated usage (review focus 2)', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw Object.assign(new Error('Context overflow'), { key: 'aiProviderUnavailable' })
      },
    })
    const result = await run({ model })
    expect(answerOf(result)).toMatchObject({
      status: 'error',
      usage: { contextTokens: FRESH_ESTIMATE, estimated: true },
    })
  })

  test('no usage when no request was built (the engine could not be selected)', async () => {
    const resolve = async () => {
      throw Object.assign(new Error('aiNoEngineAvailable'), { key: 'aiNoEngineAvailable' })
    }
    const result = await run({ extra: { resolve } })
    expect(answerOf(result).status).toBe('error')
    expect(answerOf(result).usage).toBeUndefined()
  })
})
