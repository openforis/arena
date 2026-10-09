import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'
import { z } from 'zod'

import { createConversation } from '@webapp/ai/conversations/conversationModel'
import type { AssistantMessage, Conversation } from '@webapp/ai/conversations/types'
import { DEFAULT_ASSISTANT_LIMITS, assistantAreaFeatures, runAssistantTurn } from '@webapp/ai/agent/runAssistantTurn'
import type { AiTool } from '@webapp/ai/tools/types'
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

const toolCallStream = (toolCallId: string, toolName: string, input: unknown): any =>
  convertArrayToReadableStream([
    { type: 'stream-start', warnings: [] },
    { type: 'tool-call', toolCallId, toolName, input: JSON.stringify(input) },
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

const answerOf = (conversation: Conversation): AssistantMessage => conversation.messages.at(-1) as AssistantMessage

const run = ({
  model,
  tools = [],
  conversation = createConversation({ userUuid: 'user-1', surveyId: 7, area: 'design' }),
  userMessage = 'Add a remarks field',
  access = cloudAccess,
  signal = new AbortController().signal,
  onUpdate = () => {},
  limits,
  ctx = createToolContext(),
}: {
  model: MockLanguageModelV4
  tools?: AiTool[]
  conversation?: Conversation
  userMessage?: string
  access?: typeof cloudAccess
  signal?: AbortSignal
  onUpdate?: (conversation: Conversation) => void
  limits?: { maxPromptChars: number; maxSteps: number }
  ctx?: ReturnType<typeof createToolContext>
}) =>
  runAssistantTurn({
    conversation,
    userMessage,
    area: 'design',
    ctx,
    access,
    onUpdate,
    signal,
    model,
    limits,
    systemPrompt: 'SYSTEM',
    tools,
  })

describe('runAssistantTurn', () => {
  test('constants', () => {
    expect(DEFAULT_ASSISTANT_LIMITS).toEqual({ maxPromptChars: 200000, maxSteps: 10 })
    expect(assistantAreaFeatures).toEqual({ design: 'assistantDesign', help: 'chatbot' })
  })

  test('a text turn: user message, answer, title, system prompt and history sent', async () => {
    const model = scriptedModel(() => textStream('Hello!'))
    const earlier = {
      ...createConversation({ userUuid: 'user-1', surveyId: 7, area: 'design' }),
      title: 'Earlier',
      messages: [{ id: 'u0', role: 'user', text: 'Hi', createdAt: '2026-10-07T10:00:00.000Z' } as const],
    }
    const result = await run({ model, conversation: earlier })
    expect(result.title).toBe('Earlier')
    expect(result.messages.map((message) => message.role)).toEqual(['user', 'user', 'assistant'])
    expect(answerOf(result)).toMatchObject({ status: 'done', parts: [{ type: 'text', text: 'Hello!' }] })
    const prompt: any[] = model.doStreamCalls[0].prompt
    expect(prompt[0]).toEqual({ role: 'system', content: 'SYSTEM' })
    expect(JSON.stringify(prompt.slice(1))).toBe(
      JSON.stringify([{ role: 'user', content: [{ type: 'text', text: 'Hi\n\nAdd a remarks field' }] }])
    )
    const fresh = await run({ model: scriptedModel(() => textStream('Hi')) })
    expect(fresh.title).toBe('Add a remarks field')
  })

  test('onUpdate reports every change and the result is the last report', async () => {
    const reports: Conversation[] = []
    const result = await run({ model: scriptedModel(() => textStream('Hello!')), onUpdate: (c) => reports.push(c) })
    expect(answerOf(reports[0]).status).toBe('streaming')
    expect(reports.at(-1)).toBe(result)
  })

  test('a tool call runs, its result goes back to the model, a change set is stored', async () => {
    const changeSet: any = { id: 'cs-1', surveyId: 7, summary: 'Remarks', operations: [], createdAt: '' }
    const propose = makeTool('test_propose', async (input, ctx) => {
      ctx.onChangeSet(changeSet)
      return { changeSetId: 'cs-1', operations: 0, status: 'shownToUser', summary: input.summary }
    })
    const ctx = createToolContext()
    const model = scriptedModel(
      () => toolCallStream('call-1', 'test_propose', { summary: 'Remarks' }),
      () => textStream('Review the card.')
    )
    const result = await run({ model, tools: [propose], ctx })
    expect(answerOf(result).parts).toEqual([
      {
        type: 'tool',
        toolCallId: 'call-1',
        toolName: 'test_propose',
        input: { summary: 'Remarks' },
        state: 'done',
        output: { changeSetId: 'cs-1', operations: 0, status: 'shownToUser', summary: 'Remarks' },
      },
      { type: 'text', text: 'Review the card.' },
    ])
    expect(result.changeSets).toEqual({ 'cs-1': { changeSet } })
    expect(ctx.changeSets).toEqual([changeSet])
    expect(model.doStreamCalls).toHaveLength(2)
    expect(JSON.stringify(model.doStreamCalls[1].prompt)).toContain('shownToUser')
  })

  test('a tool error goes back to the model', async () => {
    const failing = makeTool('test_fail', async () => {
      throw new Error('boom')
    })
    const model = scriptedModel(
      () => toolCallStream('call-1', 'test_fail', { summary: 'x' }),
      () => textStream('Sorry.')
    )
    const result = await run({ model, tools: [failing] })
    expect(answerOf(result).parts[0]).toMatchObject({
      type: 'tool',
      state: 'failed',
      output: { error: { code: 'toolFailed' } },
    })
    expect(answerOf(result).status).toBe('done')
    expect(JSON.stringify(model.doStreamCalls[1].prompt)).toContain('toolFailed')
  })

  test('stops at the step cap', async () => {
    const echo = makeTool('test_echo', async () => ({ ok: true }))
    let call = 0
    const model = scriptedModel(() => toolCallStream(`call-${call++}`, 'test_echo', { summary: 'x' }))
    const result = await run({ model, tools: [echo], limits: { maxPromptChars: 200000, maxSteps: 3 } })
    expect(model.doStreamCalls).toHaveLength(3)
    expect(answerOf(result).status).toBe('done')
    expect(answerOf(result).parts).toHaveLength(3)
  })

  test('abort keeps the partial answer', async () => {
    const controller = new AbortController()
    const model = new MockLanguageModelV4({
      doStream: async ({ abortSignal }) =>
        ({
          stream: new ReadableStream({
            start(streamController) {
              streamController.enqueue({ type: 'stream-start', warnings: [] })
              streamController.enqueue({ type: 'text-start', id: 't' })
              streamController.enqueue({ type: 'text-delta', id: 't', delta: 'Partial' })
              abortSignal?.addEventListener('abort', () => streamController.error(abortSignal.reason))
            },
          }),
        }) as any,
    })
    const onUpdate = (conversation: Conversation) => {
      const [part] = answerOf(conversation).parts
      if (part?.type === 'text' && part.text === 'Partial') controller.abort()
    }
    const result = await run({ model, signal: controller.signal, onUpdate })
    expect(answerOf(result)).toMatchObject({ status: 'stopped', parts: [{ type: 'text', text: 'Partial' }] })
  })

  test('gateway error ends the turn with its key', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw Object.assign(new Error('Too many requests'), { key: 'aiRateLimited' })
      },
    })
    const result = await run({ model })
    expect(answerOf(result)).toMatchObject({ status: 'error', errorKey: 'aiRateLimited' })
  })

  test('no tools when the hosting class is unknown', async () => {
    const echo = makeTool('test_echo', async () => ({ ok: true }))
    const model = scriptedModel(() => textStream('ok'))
    await run({ model, tools: [echo], access: { ...cloudAccess, hostingClass: null as any } })
    expect(model.doStreamCalls[0].tools).toBeUndefined()
    const withTools = scriptedModel(() => textStream('ok'))
    await run({ model: withTools, tools: [echo] })
    expect(withTools.doStreamCalls[0].tools?.map((tool: any) => tool.name)).toEqual(['test_echo'])
  })
})
