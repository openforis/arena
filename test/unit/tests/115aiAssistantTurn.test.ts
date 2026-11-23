import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'

import { Query } from '@common/model/query'

import { createConversation } from '@webapp/ai/conversations/conversationModel'
import type { AssistantMessage, Conversation } from '@webapp/ai/conversations/types'
import {
  DEFAULT_ASSISTANT_LIMITS,
  CONTEXT_FULL_ERROR_KEY,
  NO_ANSWER_ERROR_KEY,
  TOOL_CALL_TEXT_ERROR_KEY,
  assistantAreaFeatures,
  ASSISTANT_MAX_STEPS,
  getLastStepCheck,
  runAssistantTurn,
} from '@webapp/ai/agent/runAssistantTurn'
import type { AiTool } from '@webapp/ai/tools/types'
import {
  cloudAccess,
  createToolContext,
  finish,
  makeTool,
  scriptedModel,
  textStream,
  toolCallStream,
} from '@test/unit/utils/assistantTestUtils'

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
  extra = {},
}: {
  model?: MockLanguageModelV4
  tools?: AiTool[]
  conversation?: Conversation
  userMessage?: string
  access?: typeof cloudAccess
  signal?: AbortSignal
  onUpdate?: (conversation: Conversation) => void
  limits?: { maxPromptChars: number; maxPromptTokens?: number }
  ctx?: ReturnType<typeof createToolContext>
  extra?: Partial<Parameters<typeof runAssistantTurn>[0]>
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
    ...extra,
    systemPrompt: 'SYSTEM',
    tools,
  })

describe('runAssistantTurn', () => {
  test('constants', () => {
    expect(DEFAULT_ASSISTANT_LIMITS).toEqual({ maxPromptChars: 200000 })
    expect(assistantAreaFeatures).toEqual({
      design: 'assistantDesign',
      help: 'chatbot',
      analysis: 'assistantAnalysis',
      cleaning: 'assistantCleaning',
    })
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

  test('thinking goes to one reasoning part before the text', async () => {
    const model = scriptedModel(() =>
      convertArrayToReadableStream([
        { type: 'stream-start', warnings: [] },
        { type: 'reasoning-start', id: 'r' },
        { type: 'reasoning-delta', id: 'r', delta: 'They want ' },
        { type: 'reasoning-delta', id: 'r', delta: 'a field.' },
        { type: 'reasoning-end', id: 'r' },
        { type: 'text-start', id: 't' },
        { type: 'text-delta', id: 't', delta: 'Done.' },
        { type: 'text-end', id: 't' },
        finish('stop'),
      ] as any[])
    )
    const result = await run({ model })
    expect(answerOf(result).parts).toEqual([
      { type: 'reasoning', text: 'They want a field.' },
      { type: 'text', text: 'Done.' },
    ])
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

  describe('data class escalation', () => {
    const dataAccess = { effective: { schema: 'cloud', data: 'cloud' } as any, hostingClass: 'cloud' as const }
    const makeDataTool = (execute: AiTool['execute']): AiTool => ({
      ...makeTool('test_data', execute),
      dataClass: 'data',
    })
    const runData = (execute: AiTool['execute']) =>
      run({
        model: scriptedModel(
          () => toolCallStream('call-1', 'test_data', { summary: 'x' }),
          () => textStream('Done.')
        ),
        tools: [makeDataTool(execute)],
        access: dataAccess,
      })

    test('a successful data tool result escalates the conversation to data', async () => {
      const result = await runData(async () => ({ rows: [], total: 0 }))
      expect(result.dataClass).toBe('data')
    })

    test('a structured error result keeps the class', async () => {
      const result = await runData(async () => ({ error: { code: 'unknownQuery', message: 'x' } }))
      expect(result.dataClass).toBe('schema')
    })
  })

  test('stops when the context has no room for one more tool result: that step has no tools, and a turn without text gets the context-full notice', async () => {
    const echo = makeTool('test_echo', async () => ({ text: 'x'.repeat(400) }))
    let call = 0
    const model = scriptedModel(() => toolCallStream(`call-${call}`, 'test_echo', { summary: `x${call++}` }))
    const result = await run({ model, tools: [echo], limits: { maxPromptChars: 4000 } })
    const toolChoices = model.doStreamCalls.map((streamCall) => streamCall.toolChoice?.type)
    expect(toolChoices.length).toBeGreaterThan(2)
    expect(toolChoices.slice(0, -1).every((type) => type === 'auto')).toBe(true)
    expect(toolChoices.at(-1)).toBe('none')
    expect(answerOf(result)).toMatchObject({ status: 'error', errorKey: CONTEXT_FULL_ERROR_KEY })
    // an error without params stores none (as the messages saved before them)
    expect(answerOf(result).errorParams).toBeUndefined()
    // the tool call of the last step, where none is allowed, is not run
    expect(answerOf(result).parts).toHaveLength(toolChoices.length - 1)
  })

  describe('the last step, sent without tools because the context is full', () => {
    const markup = '<|tool_call>call:test_echo{"summary":"x"}<tool_call|>'
    const echo = makeTool('test_echo', async () => ({ text: 'x'.repeat(400) }))
    // calls the tool (a new input each time) until the step without tools, which gets the given stream
    const modelEndingWith = (lastStep: () => any, firstStep?: () => any) => {
      let call = 0
      return new MockLanguageModelV4({
        doStream: async (options: any) => {
          if (options.toolChoice?.type === 'none') return { stream: lastStep() } as any
          const stream =
            call === 0 && firstStep ? firstStep() : toolCallStream(`call-${call}`, 'test_echo', { summary: `x${call}` })
          call++
          return { stream } as any
        },
      })
    }
    const limits = { maxPromptChars: 4000 }

    test('a tool call written as text there is the full context, not a tool call text error', async () => {
      const result = await run({ model: modelEndingWith(() => textStream(markup)), tools: [echo], limits })
      expect(answerOf(result)).toMatchObject({ status: 'error', errorKey: CONTEXT_FULL_ERROR_KEY })
    })

    test('a tool call written as text there is not an answer, even after text of an earlier step', async () => {
      const textThenToolCall = () =>
        convertArrayToReadableStream([
          { type: 'stream-start', warnings: [] },
          { type: 'text-start', id: 't' },
          { type: 'text-delta', id: 't', delta: 'Looking.' },
          { type: 'text-end', id: 't' },
          { type: 'tool-call', toolCallId: 'first', toolName: 'test_echo', input: JSON.stringify({ summary: 'x' }) },
          finish('tool-calls'),
        ] as any[])
      const model = modelEndingWith(() => textStream(markup), textThenToolCall)
      const result = await run({ model, tools: [echo], limits })
      expect(answerOf(result)).toMatchObject({ status: 'error', errorKey: CONTEXT_FULL_ERROR_KEY })
    })

    test('another error there is reported as it is', async () => {
      const failing = () => {
        throw new Error('boom')
      }
      const result = await run({ model: modelEndingWith(failing), tools: [echo], limits })
      expect(answerOf(result)).toMatchObject({ status: 'error', errorKey: 'aiProviderUnavailable' })
    })
  })

  test('no step count stops a model that keeps calling tools while the context has room', async () => {
    const echo = makeTool('test_echo', async () => ({ ok: true }))
    let call = 0
    const model = scriptedModel(() =>
      call++ < 15 ? toolCallStream(`call-${call}`, 'test_echo', { summary: `x${call}` }) : textStream('Done.')
    )
    const result = await run({ model, tools: [echo] })
    expect(model.doStreamCalls).toHaveLength(16)
    expect(answerOf(result).status).toBe('done')
  })

  test.each([
    '<|tool_call>call:query_propose{"a":1}<tool_call|>',
    ' <tool_call>{"name":"x"}</tool_call>\n',
    '<|tool_call|>x<|/tool_call|>',
  ])('an answer that is only tool call markup is an error: %s', async (text) => {
    const result = await run({ model: scriptedModel(() => textStream(text)) })
    expect(answerOf(result)).toMatchObject({ status: 'error', errorKey: TOOL_CALL_TEXT_ERROR_KEY })
  })

  test('text that mentions a tool call among prose is an answer', async () => {
    const result = await run({ model: scriptedModel(() => textStream('Use <tool_call> markup carefully.')) })
    expect(answerOf(result).status).toBe('done')
  })

  const queryOnlyTurn = (conversation?: Conversation) => {
    const addQuery = makeTool('test_query', async (_input, ctx) => {
      ctx.analysisQueries?.add({ query: Query.create(), explanation: 'E', entityName: 'tree', mode: 'raw' })
      return { ok: true }
    })
    const model = scriptedModel(
      () => toolCallStream('c1', 'test_query', { summary: 'x' }),
      () => convertArrayToReadableStream([{ type: 'stream-start', warnings: [] }, finish('stop')] as any[])
    )
    return run({ model, tools: [addQuery], ...(conversation ? { conversation } : {}) })
  }

  test('a turn that only adds a new query, without a written answer, is done: the query card answers', async () => {
    const result = await queryOnlyTurn()
    expect(Object.keys(result.queries ?? {})).toEqual(['q1'])
    expect(answerOf(result).status).toBe('done')
  })

  test('a turn that only repeats an earlier query, without a written answer, is an error', async () => {
    const entry = { query: Query.create(), explanation: 'E', entityName: 'tree', mode: 'raw', createdAt: 'T' }
    const conversation = {
      ...createConversation({ userUuid: 'user-1', surveyId: 7, area: 'analysis' }),
      queries: { q1: { ...entry, id: 'q1' } },
    } as Conversation
    const result = await queryOnlyTurn(conversation)
    expect(Object.keys(result.queries ?? {})).toEqual(['q1', 'q2'])
    expect(answerOf(result)).toMatchObject({ status: 'error', errorKey: NO_ANSWER_ERROR_KEY })
  })

  test('an answer that is only a map card ends done', async () => {
    const emptyStream = () =>
      convertArrayToReadableStream([{ type: 'stream-start', warnings: [] }, finish('stop')] as any[])
    const propose = makeTool('map_proposeLayer', async () => ({
      attributeUuid: 'u1',
      attribute: 'plot_location',
      explanation: 'x',
      shownToUser: true,
    }))
    const model = scriptedModel(() => toolCallStream('call-1', 'map_proposeLayer', { summary: 'x' }), emptyStream)
    const result = await run({ model, tools: [propose] })
    expect(answerOf(result).status).toBe('done')
    // a failed proposal is not a card: the turn has no answer
    const failing = makeTool('map_proposeLayer', async () => ({ error: { code: 'invalidProposal', message: 'x' } }))
    const model2 = scriptedModel(() => toolCallStream('call-1', 'map_proposeLayer', { summary: 'x' }), emptyStream)
    const failed = await run({ model: model2, tools: [failing] })
    expect(answerOf(failed).errorKey).toBe(NO_ANSWER_ERROR_KEY)
  })

  test('the model answers after a tool call: the turn is done', async () => {
    const echo = makeTool('test_echo', async () => ({ ok: true }))
    const model = scriptedModel(
      () => toolCallStream('c1', 'test_echo', { summary: 'x' }),
      () => textStream('Here is what I found.')
    )
    const result = await run({ model, tools: [echo], limits: { maxPromptChars: 200000 } })
    expect(answerOf(result).status).toBe('done')
  })

  describe('getLastStepCheck', () => {
    const messages = (chars: number) => [{ role: 'user', content: 'x'.repeat(chars) }]
    const step = (inputTokens?: number, ...content: any[]) => ({ usage: { inputTokens }, content })

    test('the context is full when one more tool result would not fit (never on the first step)', () => {
      // a result may take an eighth of the limit: 100 of 800 chars
      const check = getLastStepCheck({ limits: { maxPromptChars: 800 }, fixedChars: 200 })
      expect(check({ stepNumber: 1, messages: messages(300), steps: [] })).toBeNull()
      expect(check({ stepNumber: 1, messages: messages(500), steps: [] })).toBe('contextFull')
      expect(check({ stepNumber: 0, messages: messages(500), steps: [] })).toBeNull()
    })

    test('tokens the provider counted decide: the last request as counted, what was added since at 3 chars per token', () => {
      const limits = { maxPromptChars: 800, maxPromptTokens: 2000 }
      const check = getLastStepCheck({ limits, fixedChars: 200 })
      check({ stepNumber: 0, messages: messages(300), steps: [] })
      // far over the characters, but few tokens: 100 counted + (3,000 added + 100 for a result) / 3 < 2,000
      expect(check({ stepNumber: 1, messages: messages(3300), steps: [step(100)] })).toBeNull()
      // 1,900 counted + (300 added + 100 for a result) / 3 > 2,000
      expect(check({ stepNumber: 2, messages: messages(3600), steps: [step(100), step(1900)] })).toBe('contextFull')
      // a provider that reports no usage: the characters decide
      const uncounted = getLastStepCheck({ limits, fixedChars: 200 })
      uncounted({ stepNumber: 0, messages: messages(300), steps: [] })
      expect(uncounted({ stepNumber: 1, messages: messages(3300), steps: [step()] })).toBe('contextFull')
    })

    test('the same failing call three times ends the tool loop; other failures do not', () => {
      const result = (input: unknown, output: unknown) => ({ type: 'tool-result', toolName: 't', input, output })
      const failed = (input: unknown) => step(undefined, result(input, { error: { code: 'invalidProposal' } }))
      const ok = (input: unknown) => step(undefined, result(input, { ok: true }))
      const thrown = step(undefined, { type: 'tool-error', toolName: 't', input: { a: 1 }, error: new Error('x') })
      const at = (steps: unknown[]) =>
        getLastStepCheck({ limits: { maxPromptChars: 200000 }, fixedChars: 0 })({
          stepNumber: steps.length,
          messages: [],
          steps: steps as any[],
        })
      expect(at([failed({ a: 1 }), failed({ a: 1 })])).toBeNull()
      expect(at([failed({ a: 1 }), failed({ a: 2 }), failed({ a: 3 })])).toBeNull()
      // a call that succeeds gives the same result again: three times is a loop too
      expect(at([ok({ a: 1 }), ok({ a: 1 })])).toBeNull()
      expect(at([ok({ a: 1 }), ok({ a: 2 }), ok({ a: 3 })])).toBeNull()
      expect(at([ok({ a: 1 }), ok({ a: 1 }), ok({ a: 2 }), ok({ a: 1 })])).toBe('repeatedCall')
      // not in a row: the count is of the turn
      expect(at([failed({ a: 1 }), failed({ a: 2 }), failed({ a: 1 }), failed({ a: 1 })])).toBe('repeatedFailure')
      expect(at([thrown, failed({ a: 1 }), thrown])).toBe('repeatedFailure')
      // the same input in another key order, nested too, is the same call
      const input = (b: unknown) => ({ a: 1, n: { x: 1, y: 2 }, b })
      const reordered = (b: unknown) => ({ b, n: { y: 2, x: 1 }, a: 1 })
      expect(at([ok(input(1)), ok(reordered(1)), ok(input(1))])).toBe('repeatedCall')
      expect(at([ok(input(1)), ok(reordered(2)), ok(input(1))])).toBeNull()
    })

    test('the last step of the turn has no tools, whatever the calls', () => {
      const check = getLastStepCheck({ limits: { maxPromptChars: 200000 }, fixedChars: 0 })
      expect(check({ stepNumber: ASSISTANT_MAX_STEPS - 2, messages: [], steps: [] })).toBeNull()
      expect(check({ stepNumber: ASSISTANT_MAX_STEPS - 1, messages: [], steps: [] })).toBe('stepLimit')
    })
  })

  describe('the same failing tool call, three times', () => {
    const failing = makeTool('test_fail', async () => ({ error: { code: 'invalidProposal', message: 'no' } }))
    // repeats the failing call; the step without tools gets the given stream
    const repeatingModel = (lastStep: () => any) => {
      let call = 0
      return new MockLanguageModelV4({
        doStream: async (options: any) =>
          ({
            stream:
              options.toolChoice?.type === 'none'
                ? lastStep()
                : toolCallStream(`call-${call++}`, 'test_fail', { summary: 'x' }),
          }) as any,
      })
    }

    test('the next step has no tools and asks for the answer', async () => {
      const model = repeatingModel(() => textStream('I could not do it.'))
      const result = await run({ model, tools: [failing] })
      expect(model.doStreamCalls.map((call) => call.toolChoice?.type)).toEqual(['auto', 'auto', 'auto', 'none'])
      const request: any = model.doStreamCalls[3].prompt.at(-1)
      expect(request.role).toBe('user')
      expect(JSON.stringify(request.content)).toContain('failed 3 times')
      expect(answerOf(result).status).toBe('done')
      expect(answerOf(result).parts.at(-1)).toEqual({ type: 'text', text: 'I could not do it.' })
    })

    test('a model that gives no answer there ends with the no-answer error, and is not asked again', async () => {
      const model = repeatingModel(() => textStream('<|tool_call>call:test_fail{"summary":"x"}<tool_call|>'))
      const result = await run({ model, tools: [failing] })
      expect(model.doStreamCalls).toHaveLength(4)
      expect(answerOf(result)).toMatchObject({ status: 'error', errorKey: NO_ANSWER_ERROR_KEY })
    })
  })

  test('the same successful call three times: the next step has no tools and asks for the answer', async () => {
    const echo = makeTool('test_echo', async () => ({ ok: true }))
    let call = 0
    const model = new MockLanguageModelV4({
      doStream: async (options: any) =>
        ({
          stream:
            options.toolChoice?.type === 'none'
              ? textStream('Here it is.')
              : toolCallStream(`call-${call++}`, 'test_echo', { summary: 'x' }),
        }) as any,
    })
    const result = await run({ model, tools: [echo] })
    expect(model.doStreamCalls.map((streamCall) => streamCall.toolChoice?.type)).toEqual([
      'auto',
      'auto',
      'auto',
      'none',
    ])
    expect(JSON.stringify(model.doStreamCalls[3].prompt.at(-1))).toContain('made 3 times')
    expect(answerOf(result).parts.at(-1)).toEqual({ type: 'text', text: 'Here it is.' })
  })

  test('a model paging through results: the last step of the turn has no tools and asks for the answer', async () => {
    const echo = makeTool('test_echo', async () => ({ ok: true }))
    let call = 0
    const model = new MockLanguageModelV4({
      doStream: async (options: any) =>
        ({
          stream:
            options.toolChoice?.type === 'none'
              ? textStream('Here is what I found.')
              : toolCallStream(`call-${call}`, 'test_echo', { summary: 'x', page: call++ }),
        }) as any,
    })
    const result = await run({ model, tools: [echo] })
    expect(model.doStreamCalls).toHaveLength(ASSISTANT_MAX_STEPS)
    expect(model.doStreamCalls.at(-1)!.toolChoice?.type).toBe('none')
    expect(JSON.stringify(model.doStreamCalls.at(-1)!.prompt.at(-1))).toContain(`limit of ${ASSISTANT_MAX_STEPS} steps`)
    expect(answerOf(result).parts.at(-1)).toEqual({ type: 'text', text: 'Here is what I found.' })
  })

  describe('a turn that ends without a word', () => {
    const echo = makeTool('test_echo', async () => ({ ok: true }))
    const thinkingOnly = () =>
      convertArrayToReadableStream([
        { type: 'stream-start', warnings: [] },
        { type: 'reasoning-start', id: 'r' },
        { type: 'reasoning-delta', id: 'r', delta: 'The result is 12.' },
        { type: 'reasoning-end', id: 'r' },
        finish('stop'),
      ] as any[])

    test('the model is asked once for the answer, after the tool results it already has', async () => {
      const model = scriptedModel(
        () => toolCallStream('c1', 'test_echo', { summary: 'x' }),
        thinkingOnly,
        () => textStream('There are 12 plots.')
      )
      const result = await run({ model, tools: [echo] })
      expect(model.doStreamCalls).toHaveLength(3)
      const { prompt }: any = model.doStreamCalls[2]
      // the request follows the tool result: the answer without text is not sent back
      expect(prompt.map((message: any) => message.role)).toEqual(['system', 'user', 'assistant', 'tool', 'user'])
      expect(JSON.stringify(prompt.at(-1).content)).toContain('without writing an answer')
      expect(answerOf(result).status).toBe('done')
      expect(answerOf(result).parts.at(-1)).toEqual({ type: 'text', text: 'There are 12 plots.' })
    })

    test('it may still call the tool it stopped short of, then answer', async () => {
      const model = scriptedModel(
        thinkingOnly,
        () => toolCallStream('c1', 'test_echo', { summary: 'x' }),
        () => textStream('There are 12 plots.')
      )
      const result = await run({ model, tools: [echo] })
      expect(model.doStreamCalls.map((call) => call.toolChoice?.type)).toEqual(['auto', 'auto', 'auto'])
      expect(answerOf(result).parts.map((part) => part.type)).toEqual(['reasoning', 'tool', 'text'])
      expect(answerOf(result).status).toBe('done')
    })

    test('a card without a word is asked for too: the words of the answer follow the card', async () => {
      const addQuery = makeTool('test_query', async (_input, ctx) => {
        ctx.analysisQueries?.add({ query: Query.create(), explanation: 'E', entityName: 'tree', mode: 'raw' })
        return { ok: true }
      })
      const model = scriptedModel(
        () => toolCallStream('c1', 'test_query', { summary: 'x' }),
        thinkingOnly,
        () => textStream('12 trees have no status.')
      )
      const result = await run({ model, tools: [addQuery] })
      expect(model.doStreamCalls).toHaveLength(3)
      expect(answerOf(result).parts.at(-1)).toEqual({ type: 'text', text: '12 trees have no status.' })
    })

    test('a model that stays silent is not asked twice: the no-answer error', async () => {
      const model = scriptedModel(() => toolCallStream('c1', 'test_echo', { summary: 'x' }), thinkingOnly)
      const result = await run({ model, tools: [echo] })
      expect(model.doStreamCalls).toHaveLength(3)
      expect(answerOf(result)).toMatchObject({ status: 'error', errorKey: NO_ANSWER_ERROR_KEY })
    })

    test('silent on the first step: the request joins the user message (never two user messages in a row)', async () => {
      const model = scriptedModel(thinkingOnly, () => textStream('Hello.'))
      const result = await run({ model })
      const prompt: any[] = model.doStreamCalls[1].prompt
      expect(prompt.map((message) => message.role)).toEqual(['system', 'user'])
      expect(JSON.stringify(prompt[1].content)).toMatch(/Add a remarks field.*without writing an answer/)
      expect(answerOf(result).status).toBe('done')
    })

    test('a stopped or failed turn is not asked', async () => {
      const failing = scriptedModel(() => {
        throw new Error('boom')
      })
      const failed = await run({ model: failing })
      expect(failing.doStreamCalls).toHaveLength(1)
      expect(answerOf(failed).status).toBe('error')
    })
  })

  test('an error stores its params with the answer', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw Object.assign(new Error('x'), {
          key: 'aiLocalServerUnreachable',
          params: { baseUrl: 'http://localhost:1234' },
        })
      },
    })
    const result = await run({ model })
    expect(answerOf(result)).toMatchObject({
      status: 'error',
      errorKey: 'aiLocalServerUnreachable',
      errorParams: { baseUrl: 'http://localhost:1234' },
    })
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

  test('the turn query store continues the conversation queries and they survive an abort', async () => {
    const entry = { query: Query.create(), explanation: 'E', entityName: 'tree', mode: 'raw', createdAt: 'T' }
    const conversation = {
      ...createConversation({ userUuid: 'user-1', surveyId: 7, area: 'design' }),
      queries: { q1: { ...entry, id: 'q1' }, q2: { ...entry, id: 'q2' } },
    }
    const controller = new AbortController()
    const propose = makeTool('test_query', async (_input, ctx) => {
      const added = ctx.analysisQueries?.add({
        query: Query.create(),
        explanation: 'E',
        entityName: 'tree',
        mode: 'raw',
      })
      controller.abort()
      return { queryId: added?.id }
    })
    const model = scriptedModel(() => toolCallStream('call-1', 'test_query', { summary: 'x' }))
    const result = await run({ model, tools: [propose], conversation, signal: controller.signal })
    expect(answerOf(result).status).toBe('stopped')
    expect(Object.keys(result.queries ?? {})).toEqual(['q1', 'q2', 'q3'])
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
  describe('engine resolution (no model given)', () => {
    const localEngine: any = {
      id: 'localServer',
      hostingClass: 'onDevice',
      label: 'LM Studio',
      model: 'local-model',
      limits: { maxPromptChars: 5000 },
    }

    test('a consent cancel ends as stopped, without an error key', async () => {
      const cancelled = Object.assign(new Error('aiLocalServerConsentCancelled'), {
        key: 'aiLocalServerConsentCancelled',
      })
      const resolve = async () => {
        throw cancelled
      }
      const result = await run({ extra: { resolve } })
      expect(answerOf(result).status).toBe('stopped')
      expect(answerOf(result).errorKey).toBeUndefined()
    })

    test('the turn resolves its engine once and uses the engine limits', async () => {
      const echo = makeTool('test_echo', async () => ({ text: 'x'.repeat(400) }))
      let call = 0
      const model = scriptedModel(() => toolCallStream(`c${call}`, 'test_echo', { summary: `a${call++}` }))
      const calls: unknown[] = []
      /** Resolves the local engine and records the call. */
      const resolve = async (params: unknown) => {
        calls.push(params)
        return { model, engine: localEngine, policy: { schema: 'onDevice', data: 'onDevice' } as const }
      }
      const result = await run({ tools: [echo], extra: { resolve } })
      expect(calls).toHaveLength(1)
      // the 5,000 chars of the engine, not the default 200,000, end the loop
      expect(model.doStreamCalls.length).toBeLessThan(15)
      expect(model.doStreamCalls.at(-1)?.toolChoice?.type).toBe('none')
      expect(answerOf(result)).toMatchObject({ status: 'error', errorKey: CONTEXT_FULL_ERROR_KEY })
    })

    test('a data tool makes the turn declare data in the one resolution, and the model receives the tool', async () => {
      const dataTool: AiTool = { ...makeTool('test_data', async () => ({ ok: true })), dataClass: 'data' }
      const model = scriptedModel(() => textStream('ok'))
      const calls: any[] = []
      const declared: unknown[] = []
      const policy = { schema: 'onDevice', data: 'onDevice' } as const
      const resolve = async (params: any) => {
        calls.push(params)
        declared.push(params.declareDataClass({ engine: localEngine, policy }))
        return { model, engine: localEngine, policy }
      }
      const access: any = { effective: policy, hostingClass: 'onDevice' }
      await run({ tools: [dataTool], access, extra: { resolve } })
      expect(calls.map((call) => call.dataClass)).toEqual(['schema'])
      expect(declared).toEqual(['data'])
      expect(model.doStreamCalls[0].tools?.map((tool: any) => tool.name)).toEqual(['test_data'])
    })

    test('the data decision and the tool list use the policy of the resolver, not the one read before the turn', async () => {
      const dataTool: AiTool = { ...makeTool('test_data', async () => ({ ok: true })), dataClass: 'data' }
      const model = scriptedModel(() => textStream('ok'))
      const fresh = { schema: 'onDevice', data: 'onDevice' } as const
      const declared: unknown[] = []
      const resolve = async (params: any) => {
        declared.push(params.declareDataClass({ engine: localEngine, policy: fresh }))
        return { model, engine: localEngine, policy: fresh }
      }
      // the policy read before the turn does not let record data leave the device
      const access: any = { effective: { schema: 'onDevice', data: 'off' }, hostingClass: 'onDevice' }
      await run({ tools: [dataTool], access, extra: { resolve } })
      expect(declared).toEqual(['data'])
      expect(model.doStreamCalls[0].tools?.map((tool: any) => tool.name)).toEqual(['test_data'])
    })
  })
})
