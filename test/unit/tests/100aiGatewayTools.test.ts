import { MockLanguageModelV4 } from 'ai/test'

import { deserializeStreamPart, serializeGenerateResult, serializeStreamPart } from '@common/ai/wire'
import { sanitizeCall } from '@server/modules/ai/service/gateway/callValidation'
import { handleModelRequest } from '@server/modules/ai/service/gateway/modelGateway'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'
import { createGatewayModel } from '@webapp/ai/runtime/gatewayModel'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { createFakeRequest, createFakeResponse } from '@test/unit/utils/fakeExpress'

const mapError = () => ({ key: 'aiProviderUnavailable' })
const prompt = [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }]
const tool = { type: 'function', name: 'docs_search', description: 'Search', inputSchema: { type: 'object' } }
const limits = { maxPromptChars: 1000, maxOutputTokens: 100 }
const withTools = { ...limits, allowTools: true }

const toolTurnPrompt = [
  ...prompt,
  {
    role: 'assistant',
    content: [
      { type: 'reasoning', text: 'search first' },
      { type: 'tool-call', toolCallId: 'c1', toolName: 'docs_search', input: { query: 'x' } },
    ],
  },
  {
    role: 'tool',
    content: [{ type: 'tool-result', toolCallId: 'c1', toolName: 'docs_search', output: { type: 'json', value: [] } }],
  },
]

describe('wire: tool calls', () => {
  test('a tool-call stream part is forwarded without provider metadata', () => {
    const part: any = {
      type: 'tool-call',
      toolCallId: 'c1',
      toolName: 'docs_search',
      input: '{"query":"x"}',
      providerMetadata: { p: { secret: 1 } },
    }
    const json = serializeStreamPart(part, mapError)
    expect(deserializeStreamPart(JSON.parse(JSON.stringify(json)))).toEqual({
      type: 'tool-call',
      toolCallId: 'c1',
      toolName: 'docs_search',
      input: '{"query":"x"}',
    })
  })

  test('provider-executed tool calls are not forwarded', () => {
    const part: any = { type: 'tool-call', toolCallId: 'c1', toolName: 'web', input: '{}', providerExecuted: true }
    expect(serializeStreamPart(part, mapError)).toBeNull()
  })

  test('generate results keep client tool calls', () => {
    const result: any = {
      content: [{ type: 'tool-call', toolCallId: 'c1', toolName: 'docs_search', input: '{}', providerMetadata: {} }],
      finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
      usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
      warnings: [],
    }
    expect((serializeGenerateResult(result) as any).content).toEqual([
      { type: 'tool-call', toolCallId: 'c1', toolName: 'docs_search', input: '{}' },
    ])
  })
})

describe('sanitizeCall with tools', () => {
  test('keeps function tools reduced to their definition, and the tool choice', () => {
    const call = sanitizeCall(
      { prompt, tools: [{ ...tool, providerOptions: { x: 1 } }], toolChoice: { type: 'auto' } },
      withTools
    )
    expect(call.tools).toEqual([tool])
    expect(call.toolChoice).toEqual({ type: 'auto' })
  })

  test('accepts tool calls and tool results in the prompt', () => {
    expect(sanitizeCall({ prompt: toolTurnPrompt, tools: [tool] }, withTools).prompt).toEqual(toolTurnPrompt)
  })

  test('drops unknown keys from tool-call and tool-result parts, and their outputs', () => {
    const dirty: any = [
      ...prompt,
      {
        role: 'assistant',
        providerOptions: { m: 1 },
        content: [
          { type: 'reasoning', text: 'r', providerOptions: { p: 1 }, extra: 1 },
          {
            type: 'tool-call',
            toolCallId: 'c1',
            toolName: 'docs_search',
            input: { q: 1 },
            providerExecuted: true,
            providerOptions: { p: 1 },
            extra: 1,
          },
        ],
      },
      {
        role: 'tool',
        extra: 1,
        content: [
          {
            type: 'tool-result',
            toolCallId: 'c1',
            toolName: 'docs_search',
            output: { type: 'json', value: [], providerOptions: { p: 1 }, extra: 1 },
            providerOptions: { p: 1 },
            extra: 1,
          },
        ],
      },
    ]
    expect(sanitizeCall({ prompt: dirty, tools: [tool] }, withTools).prompt).toEqual([
      ...prompt,
      {
        role: 'assistant',
        content: [
          { type: 'reasoning', text: 'r' },
          { type: 'tool-call', toolCallId: 'c1', toolName: 'docs_search', input: { q: 1 } },
        ],
      },
      {
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: 'c1', toolName: 'docs_search', output: { type: 'json', value: [] } },
        ],
      },
    ])
  })

  test('rejects a tool result with an unsupported output', async () => {
    const bad = [
      ...prompt,
      {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'c', toolName: 'docs_search', output: { type: 'weird' } }],
      },
    ]
    await expectSystemErrorKey(() => sanitizeCall({ prompt: bad, tools: [tool] }, withTools), 'aiCallInvalid')
  })

  test('the tool inputs and outputs count toward the prompt size', async () => {
    const big = [
      ...prompt,
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'c',
            toolName: 'docs_search',
            output: { type: 'text', value: 'x'.repeat(1000) },
          },
        ],
      },
    ]
    await expectSystemErrorKey(() => sanitizeCall({ prompt: big, tools: [tool] }, withTools), 'aiPromptTooLarge')
  })

  test('a specific tool choice must name a forwarded tool', async () => {
    const choice = { type: 'tool', toolName: 'docs_search' }
    expect(sanitizeCall({ prompt, tools: [tool], toolChoice: choice }, withTools).toolChoice).toEqual(choice)
    await expectSystemErrorKey(
      () => sanitizeCall({ prompt, tools: [tool], toolChoice: { type: 'tool', toolName: 'other' } }, withTools),
      'aiCallInvalid'
    )
  })

  test('the tool definitions count toward the prompt size', async () => {
    const big = { ...tool, description: 'x'.repeat(990) }
    const error = await expectSystemErrorKey(
      () => sanitizeCall({ prompt, tools: [big] }, withTools),
      'aiPromptTooLarge'
    )
    expect(error.statusCode).toBe(413)
  })

  test.each([
    ['a provider tool', { prompt, tools: [{ type: 'provider', id: 'openai.web_search', name: 'web', args: {} }] }],
    ['an invalid tool name', { prompt, tools: [{ ...tool, name: 'docs.search' }] }],
    ['duplicate tool names', { prompt, tools: [tool, tool] }],
    ['a tool without input schema', { prompt, tools: [{ type: 'function', name: 'x' }] }],
    ['too many tools', { prompt, tools: Array.from({ length: 33 }, (_, i) => ({ ...tool, name: `t${i}` })) }],
    ['a tool choice without tools', { prompt, toolChoice: { type: 'auto' } }],
    [
      'a file part from the user',
      { prompt: [{ role: 'user', content: [{ type: 'file', data: 'x', mediaType: 'a/b' }] }] },
    ],
  ])('rejects %s', async (_label, call) => {
    await expectSystemErrorKey(() => sanitizeCall(call, withTools), 'aiCallInvalid')
  })

  test.each([
    ['tools', { prompt, tools: [tool] }],
    ['tool calls in the prompt', { prompt: toolTurnPrompt }],
  ])('without allowTools, %s are refused', async (_label, call) => {
    await expectSystemErrorKey(() => sanitizeCall(call, limits), 'aiCallInvalid')
  })
})

describe('handleModelRequest with tools', () => {
  const user: any = {
    uuid: 'user-1',
    prefs: { ai: { featuresEnabled: true, featureToggles: { chat: true, expressions: true } } },
  }
  const createModel = () =>
    new MockLanguageModelV4({
      doGenerate: async () =>
        ({
          content: [{ type: 'tool-call', toolCallId: 'c1', toolName: 'docs_search', input: '{"query":"x"}' }],
          finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
          usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
          warnings: [],
        }) as any,
    })
  const createDeps = (model: any) => ({
    resolveModel: async () => ({ model, meta: { source: 'admin-default', provider: 'openai', model: 'm' } }),
    assertPolicyAllows: async () => {},
    rateLimiter: createRateLimiter({ limitPerMinute: 0 }),
    recordTelemetry: () => {},
    logError: () => {},
    limits: { maxPromptChars: 1000, maxOutputTokens: 100, timeoutMs: 5000 },
    gateEnv: { aiFeaturesEnabled: true, aiFeatureFlags: null },
  })
  const run = async (body: unknown, model: any) => {
    const res = createFakeResponse()
    await handleModelRequest({ req: createFakeRequest(body), res, user, deps: createDeps(model) as any })
    return res
  }

  test('a tool feature forwards the tools and returns the tool call', async () => {
    const model = createModel()
    const res = await run(
      { feature: 'chatbot', dataClass: 'schema', stream: false, call: { prompt, tools: [tool] } },
      model
    )
    expect(res.statusCode).toBe(200)
    expect(res.body.content).toEqual([
      { type: 'tool-call', toolCallId: 'c1', toolName: 'docs_search', input: '{"query":"x"}' },
    ])
    expect(model.doGenerateCalls[0].tools).toEqual([tool])
  })

  test('other features still refuse tools, without calling the model', async () => {
    const model = createModel()
    const res = await run(
      {
        surveyId: 1,
        feature: 'expressionGenerate',
        dataClass: 'schema',
        stream: false,
        call: { prompt, tools: [tool] },
      },
      model
    )
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiCallInvalid' })
    expect(model.doGenerateCalls).toHaveLength(0)
  })
})

describe('gateway model', () => {
  test('sends function tools (definition only) and the tool choice', async () => {
    const bodies: any[] = []
    const fetchImpl = async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)))
      const result = { content: [], finishReason: { unified: 'stop' }, usage: {}, warnings: [] }
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    const model = createGatewayModel({ feature: 'chatbot', dataClass: 'schema', fetchImpl: fetchImpl as any })
    await model.doGenerate({
      prompt: prompt as any,
      tools: [{ ...tool, providerOptions: { x: { y: 1 } } } as any],
      toolChoice: { type: 'auto' },
    })
    expect(bodies[0].call.tools).toEqual([tool])
    expect(bodies[0].call.toolChoice).toEqual({ type: 'auto' })
  })

  test('sends no tool choice without tools', async () => {
    const bodies: any[] = []
    const fetchImpl = async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)))
      const result = { content: [], finishReason: { unified: 'stop' }, usage: {}, warnings: [] }
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    const model = createGatewayModel({ feature: 'chatbot', dataClass: 'schema', fetchImpl: fetchImpl as any })
    await model.doGenerate({ prompt: prompt as any, toolChoice: { type: 'auto' } })
    expect(bodies[0].call.tools).toBeUndefined()
    expect(bodies[0].call.toolChoice).toBeUndefined()
  })
})
