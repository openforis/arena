import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'

import { AiFeatures, getAiFeature } from '@common/ai/features'
import { SCHEMA_TOOL_NAMES, isSchemaTool } from '@common/ai/schemaTools'
import {
  getEnforcedDataClass,
  parseGatewayRequest,
  sanitizeCall,
} from '@server/modules/ai/service/gateway/callValidation'
import { handleModelRequest } from '@server/modules/ai/service/gateway/modelGateway'
import { createPolicyEnforcer } from '@server/modules/ai/service/gateway/policy'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'
import { ALL_TOOLS } from '@webapp/ai/tools/allTools'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { createFakeRequest, createFakeResponse, parseSseWrites } from '@test/unit/utils/fakeExpress'

const prompt = [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }]
const toolResultTurn = (...toolNames: string[]) => [
  ...prompt,
  {
    role: 'assistant',
    content: toolNames.map((toolName, index) => ({
      type: 'tool-call',
      toolCallId: `c${index}`,
      toolName,
      input: {},
    })),
  },
  {
    role: 'tool',
    content: toolNames.map((toolName, index) => ({
      type: 'tool-result',
      toolCallId: `c${index}`,
      toolName,
      output: { type: 'json', value: [] },
    })),
  },
]
const tool = (name: string) => ({ type: 'function', name, description: 'x', inputSchema: { type: 'object' } })
const limits = { maxPromptChars: 100000, maxOutputTokens: 100 }

describe('gateway server rules: surveyId on login-only features (321)', () => {
  const chatBody = { feature: 'chatbot', dataClass: 'schema', stream: false, call: { prompt } }

  test('a login-only feature takes no surveyId, so its policy cannot be probed', async () => {
    expect(parseGatewayRequest(chatBody).surveyId).toBeUndefined()
    const error = await expectSystemErrorKey(() => parseGatewayRequest({ ...chatBody, surveyId: 7 }), 'aiCallInvalid')
    expect(error.params).toEqual({ reason: 'surveyId' })
    expect(error.statusCode).toBe(400)
  })

  test('a null surveyId counts as absent', () => {
    expect(parseGatewayRequest({ ...chatBody, surveyId: null }).surveyId).toBeUndefined()
  })

  test('every other gateway feature still needs one', async () => {
    const needSurvey = Object.values(AiFeatures).filter(
      (feature) => feature.gateway && feature.permission !== 'loggedIn'
    )
    expect(needSurvey.length).toBeGreaterThan(0)
    for (const feature of needSurvey) {
      const body = { feature: feature.key, dataClass: feature.variableDataClass ? 'schema' : feature.dataClass }
      await expectSystemErrorKey(
        () => parseGatewayRequest({ ...body, stream: false, call: { prompt } }),
        'aiCallInvalid'
      )
    }
  })
})

describe('gateway server rules: the data class follows the tool results (321)', () => {
  test('a request with tool results is checked as the feature maximum, whatever it declares', () => {
    const call = sanitizeCall(
      { prompt: toolResultTurn('query_run'), tools: [tool('query_run')] },
      { ...limits, allowTools: true }
    )
    expect(getEnforcedDataClass({ feature: 'assistantAnalysis', dataClass: 'schema', call })).toBe('data')
  })

  test('a request without tool results keeps the declared class', () => {
    const call = sanitizeCall({ prompt }, { ...limits, allowTools: true })
    expect(getEnforcedDataClass({ feature: 'assistantAnalysis', dataClass: 'schema', call })).toBe('schema')
    expect(getEnforcedDataClass({ feature: 'assistantAnalysis', dataClass: 'data', call })).toBe('data')
  })

  test('a feature whose maximum is schema stays schema', () => {
    const call = sanitizeCall({ prompt: toolResultTurn('query_run') }, { ...limits, allowTools: true })
    expect(getEnforcedDataClass({ feature: 'assistantDesign', dataClass: 'schema', call })).toBe('schema')
  })

  test('results of schema tools do not raise the class: they carry no record data', () => {
    const options = { ...limits, allowTools: true }
    for (const names of [['conversation_setTitle'], ['nodeDef_search', 'survey_getOverview', 'docs_search']]) {
      const call = sanitizeCall({ prompt: toolResultTurn(...names) }, options)
      expect(getEnforcedDataClass({ feature: 'assistantAnalysis', dataClass: 'schema', call })).toBe('schema')
    }
  })

  test('one data tool result among schema ones raises the class', () => {
    const call = sanitizeCall(
      { prompt: toolResultTurn('conversation_setTitle', 'query_run') },
      { ...limits, allowTools: true }
    )
    expect(getEnforcedDataClass({ feature: 'assistantAnalysis', dataClass: 'schema', call })).toBe('data')
  })

  test('a tool the server does not know counts as data', () => {
    const call = sanitizeCall({ prompt: toolResultTurn('brand_new_tool') }, { ...limits, allowTools: true })
    expect(getEnforcedDataClass({ feature: 'assistantAnalysis', dataClass: 'schema', call })).toBe('data')
  })

  test('the calls of a data tool without its result do not raise the class', () => {
    const turn = toolResultTurn('query_run').slice(0, -1)
    const call = sanitizeCall({ prompt: turn }, { ...limits, allowTools: true })
    expect(getEnforcedDataClass({ feature: 'assistantAnalysis', dataClass: 'schema', call })).toBe('schema')
  })

  test('the schema tool list of the server is the list of schema tools of the browser', () => {
    const browserSchemaTools = ALL_TOOLS.filter((candidate) => candidate.dataClass === 'schema').map(
      (candidate) => candidate.name
    )
    expect([...SCHEMA_TOOL_NAMES].sort()).toEqual(browserSchemaTools.sort())
    for (const candidate of ALL_TOOLS)
      expect([candidate.name, isSchemaTool(candidate.name)]).toEqual([candidate.name, candidate.dataClass === 'schema'])
  })

  describe('under the default survey policy (schema: cloud, data: onDevice) with a cloud provider', () => {
    const enforceDefaultPolicy = createPolicyEnforcer({
      fetchRawPolicy: async () => null,
      getCeilings: () => ({ schema: 'cloud', data: 'cloud' }),
    })
    const cloudModel = (model: any) => async () => ({
      model,
      meta: { source: 'user', provider: 'openai', model: 'm', hostingClass: 'cloud' },
    })
    const analysisBody = (...toolNames: string[]) => ({
      surveyId: 1,
      feature: 'assistantAnalysis',
      dataClass: 'schema',
      stream: false,
      call: { prompt: toolResultTurn(...toolNames), tools: [tool('conversation_setTitle'), tool('query_run')] },
    })

    test('step 2 of an Analysis turn with a schema tool result is allowed', async () => {
      const model = generateModel()
      const { deps } = createDeps(model, {
        assertPolicyAllows: enforceDefaultPolicy,
        resolveModel: cloudModel(model),
      })
      const res = await run(analysisBody('conversation_setTitle'), deps)
      expect(res.statusCode).toBe(200)
      expect(model.doGenerateCalls).toHaveLength(1)
    })

    test('a data tool result is checked as data: refused, and the provider is not called', async () => {
      const model = generateModel()
      const { deps } = createDeps(model, {
        assertPolicyAllows: enforceDefaultPolicy,
        resolveModel: cloudModel(model),
      })
      const res = await run(analysisBody('query_run'), deps)
      expect(res.statusCode).toBe(403)
      expect(res.body).toMatchObject({
        key: 'aiPolicyRefused',
        params: { dataClass: 'data', hostingClass: 'cloud', allowed: 'onDevice' },
      })
      expect(model.doGenerateCalls).toHaveLength(0)
    })
  })

  test('the policy check of the gateway gets the raised class', async () => {
    const checks: any[] = []
    const { deps } = createDeps(generateModel(), {
      assertPolicyAllows: async (check: any) => {
        checks.push(check)
      },
    })
    const res = await run(
      {
        surveyId: 1,
        feature: 'assistantAnalysis',
        dataClass: 'schema',
        stream: false,
        call: { prompt: toolResultTurn('query_run'), tools: [tool('query_run')] },
      },
      deps
    )
    expect(res.statusCode).toBe(200)
    expect(checks).toEqual([{ surveyId: 1, dataClass: 'data', hostingClass: null }])
  })
})

describe('gateway server rules: tool allowlist (321)', () => {
  test('the Help tools of the server are the tools of the Help area', () => {
    const helpTools = ALL_TOOLS.filter((candidate) => candidate.area.includes('help')).map(
      (candidate) => candidate.name
    )
    expect([...(getAiFeature('chatbot')?.toolNames ?? [])].sort()).toEqual(helpTools.sort())
  })

  test('a tool outside the allowlist of the feature is refused', async () => {
    const allowedToolNames = ['docs_search']
    const options = { ...limits, allowTools: true, allowedToolNames }
    expect(sanitizeCall({ prompt, tools: [tool('docs_search')] }, options).tools).toHaveLength(1)
    const error = await expectSystemErrorKey(
      () => sanitizeCall({ prompt, tools: [tool('docs_search'), tool('records_proposeEdits')] }, options),
      'aiCallInvalid'
    )
    expect(error.params).toEqual({ reason: 'tools.name' })
  })

  test('without an allowlist any valid tool name passes (assistant areas)', () => {
    const options = { ...limits, allowTools: true }
    expect(sanitizeCall({ prompt, tools: [tool('anything_goes')] }, options).tools).toHaveLength(1)
  })

  test('the gateway applies the allowlist of the chatbot, without calling the model', async () => {
    const model = generateModel()
    const { deps } = createDeps(model)
    const res = await run(
      {
        feature: 'chatbot',
        dataClass: 'schema',
        stream: false,
        call: { prompt, tools: [tool('docs_search'), tool('records_proposeEdits')] },
      },
      deps
    )
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ key: 'aiCallInvalid' })
    expect(model.doGenerateCalls).toHaveLength(0)
  })
})

describe('gateway server rules: a model asking for a tool it was not offered (321)', () => {
  const finishReason = { unified: 'tool-calls', raw: 'tool_calls' }
  const usage = { inputTokens: { total: 1 }, outputTokens: { total: 1 } }
  const chatBody = (stream: boolean, tools = [tool('docs_search')]) => ({
    feature: 'chatbot',
    dataClass: 'schema',
    stream,
    call: { prompt, tools },
  })
  const toolCall = (toolName: string) => ({ type: 'tool-call', toolCallId: 'c1', toolName, input: '{}' })

  test('generate: an offered tool call is forwarded', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => ({ content: [toolCall('docs_search')], finishReason, usage, warnings: [] }) as any,
    })
    const res = await run(chatBody(false), createDeps(model).deps)
    expect(res.statusCode).toBe(200)
    expect(res.body.content).toEqual([toolCall('docs_search')])
  })

  test('generate: a tool call for a tool that was not offered is refused and not forwarded', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => ({ content: [toolCall('view_getCurrent')], finishReason, usage, warnings: [] }) as any,
    })
    const { deps, telemetry } = createDeps(model)
    const res = await run(chatBody(false), deps)
    expect(res.statusCode).toBe(502)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiToolNotOffered' })
    expect(JSON.stringify(res.body)).not.toContain('view_getCurrent')
    expect(telemetry).toHaveLength(1)
    expect(telemetry[0].outcome.error).toBeDefined()
  })

  test('generate: a tool call when no tool was offered is refused', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => ({ content: [toolCall('docs_search')], finishReason, usage, warnings: [] }) as any,
    })
    const res = await run(chatBody(false, []), createDeps(model).deps)
    expect(res.statusCode).toBe(502)
    expect(res.body.key).toBe('aiToolNotOffered')
  })

  test('stream: the call is not forwarded, the client gets the error and the provider stream is cancelled', async () => {
    let cancelled = false
    const parts = [{ type: 'stream-start', warnings: [] }, toolCall('records_proposeEdits')]
    const model = new MockLanguageModelV4({
      doStream: async () =>
        ({
          stream: new ReadableStream({
            start(controller) {
              for (const part of parts) controller.enqueue(part)
            },
            cancel() {
              cancelled = true
            },
          }),
        }) as any,
    })
    const { deps, telemetry } = createDeps(model)
    const res = await run(chatBody(true), deps)
    const frames = parseSseWrites(res) as any[]
    expect(frames.map((frame) => frame.type ?? frame)).toEqual(['stream-start', 'error', '[DONE]'])
    expect(frames[1].error).toEqual({ key: 'aiToolNotOffered', params: {} })
    expect(res.writes.join('')).not.toContain('records_proposeEdits')
    expect(cancelled).toBe(true)
    expect(telemetry).toHaveLength(1)
    expect(telemetry[0].outcome.error).toBeDefined()
  })

  test('stream: an offered tool call goes through', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () =>
        ({
          stream: convertArrayToReadableStream([
            { type: 'stream-start', warnings: [] },
            toolCall('docs_search'),
            { type: 'finish', finishReason, usage },
          ]),
        }) as any,
    })
    const res = await run(chatBody(true), createDeps(model).deps)
    const frames = parseSseWrites(res) as any[]
    expect(frames.map((frame) => frame.type ?? frame)).toEqual(['stream-start', 'tool-call', 'finish', '[DONE]'])
  })
})

const user: any = {
  uuid: 'user-1',
  prefs: { ai: { featuresEnabled: true, featureToggles: { chat: true, assistantAnalysis: true } } },
}

/**
 * Builds a model answering with one text.
 * @returns {MockLanguageModelV4} The model.
 */
function generateModel() {
  return new MockLanguageModelV4({
    doGenerate: async () =>
      ({
        content: [{ type: 'text', text: 'ok' }],
        finishReason: { unified: 'stop', raw: 'stop' },
        usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
        warnings: [],
      }) as any,
  })
}

/**
 * Builds the gateway dependencies around a model.
 * @param {MockLanguageModelV4} model - The model.
 * @param {object} [overrides] - Dependencies to replace.
 * @returns {object} The dependencies and what they recorded.
 */
function createDeps(model: any, overrides: Record<string, unknown> = {}) {
  const telemetry: any[] = []
  const deps = {
    resolveModel: async () => ({ model, meta: { source: 'user', provider: 'openai', model: 'm' } }),
    assertPolicyAllows: async () => {},
    rateLimiter: createRateLimiter({ limitPerMinute: 0 }),
    recordTelemetry: (ctx: any, outcome: any) => telemetry.push({ ctx, outcome }),
    logError: () => {},
    limits: { maxPromptChars: 100000, maxOutputTokens: 100, timeoutMs: 5000 },
    gateEnv: { aiFeaturesEnabled: true, aiFeatureFlags: null },
    ...overrides,
  }
  return { deps, telemetry }
}

/**
 * Runs one gateway request.
 * @param {object} body - Request body.
 * @param {object} deps - Gateway dependencies.
 * @returns {Promise<object>} The fake response.
 */
async function run(body: unknown, deps: any) {
  const res = createFakeResponse()
  await handleModelRequest({ req: createFakeRequest(body), res, user, deps })
  return res
}
