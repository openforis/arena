import { MockLanguageModelV4 } from 'ai/test'

import SystemError, { StatusCodes } from '@core/systemError'
import { getCallSize, sanitizeCall } from '@server/modules/ai/service/gateway/callValidation'
import { createDailyBudgetCharger } from '@server/modules/ai/service/gateway/dailyBudget'
import { createDefaultModelGatewayDeps, handleModelRequest } from '@server/modules/ai/service/gateway/modelGateway'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'
import { isRunStoppingError } from '@webapp/ai/workflows/batchRun'
import { ENV } from '@core/processUtils'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { createFakeRequest, createFakeResponse, parseSseWrites } from '@test/unit/utils/fakeExpress'

const prompt = [{ role: 'user', content: [{ type: 'text', text: 'Hello there' }] }]

describe('daily budget of the Arena default provider: the charger (322)', () => {
  const userUuid = 'user-1'

  /**
   * Builds a charger around a fake repository that records its calls.
   * @param {object} params - Parameters.
   * @returns {object} The charger and the recorded calls.
   */
  const createCharger = ({
    limits = { calls: 200, chars: 2000000 },
    answer = { day: '2026-10-15', calls: 1, chars: 11 } as unknown,
  } = {}) => {
    const charges: any[] = []
    const charge = createDailyBudgetCharger({
      limits,
      repository: {
        chargeAiUsage: async (params: any) => {
          charges.push(params)
          return answer as any
        },
      },
    })
    return { charge, charges }
  }

  test('a call is charged to the user with the limits; the day is left to the database clock', async () => {
    const { charge, charges } = createCharger()
    await charge({ userUuid, chars: 11 })
    expect(charges).toEqual([{ userUuid, chars: 11, callLimit: 200, charLimit: 2000000 }])
  })

  test('a call over the budget (no row updated) is refused with a 429 aiDailyBudgetExceeded', async () => {
    const { charge } = createCharger({ answer: null })
    const error = await expectSystemErrorKey(() => charge({ userUuid, chars: 11 }), 'aiDailyBudgetExceeded')
    expect(error.statusCode).toBe(429)
  })

  test('0 means unlimited: nothing is stored and nothing is checked', async () => {
    const { charge, charges } = createCharger({ limits: { calls: 0, chars: 0 }, answer: null })
    await expect(charge({ userUuid, chars: 999999999 })).resolves.toBeUndefined()
    expect(charges).toEqual([])
  })

  test('one limit can be unlimited while the other applies', async () => {
    const { charge, charges } = createCharger({ limits: { calls: 5, chars: 0 } })
    await charge({ userUuid, chars: 11 })
    expect(charges[0]).toMatchObject({ callLimit: 5, charLimit: 0 })
  })

  test('a negative or invalid limit counts as unlimited', async () => {
    const { charge, charges } = createCharger({ limits: { calls: -3, chars: Number.NaN } })
    await charge({ userUuid, chars: 11 })
    expect(charges).toEqual([])
  })

  test('a failure of the database is not turned into a refusal', async () => {
    const charge = createDailyBudgetCharger({
      limits: { calls: 1, chars: 1 },
      repository: {
        chargeAiUsage: async () => {
          throw new Error('connection lost')
        },
      },
    })
    await expect(charge({ userUuid, chars: 1 })).rejects.toThrow('connection lost')
  })
})

describe('daily budget: the size of a call (322)', () => {
  const tool = { type: 'function', name: 'docs_search', description: 'Searches', inputSchema: { type: 'object' } }

  test('is the text of the messages', () => {
    const call = sanitizeCall(
      { prompt: [{ role: 'system', content: 'Be brief' }, ...prompt] },
      { maxPromptChars: 1000, maxOutputTokens: 10 }
    )
    expect(getCallSize(call)).toBe('Be brief'.length + 'Hello there'.length)
  })

  test('counts the tool definitions too', () => {
    const options = { maxPromptChars: 100000, maxOutputTokens: 10, allowTools: true }
    const withTools = getCallSize(sanitizeCall({ prompt, tools: [tool] }, options))
    expect(withTools).toBe('Hello there'.length + JSON.stringify([tool]).length)
  })

  test('is the same size the prompt limit is checked against', async () => {
    const options = { maxPromptChars: 100000, maxOutputTokens: 10, allowTools: true }
    const call = sanitizeCall({ prompt, tools: [tool] }, options)
    const error = await expectSystemErrorKey(
      () => sanitizeCall({ prompt, tools: [tool] }, { ...options, maxPromptChars: getCallSize(call) - 1 }),
      'aiPromptTooLarge'
    )
    expect(error.params.size).toBe(getCallSize(call))
  })
})

describe('daily budget: the gateway charges the Arena default only (322)', () => {
  const user: any = { uuid: 'user-7', prefs: { ai: { featuresEnabled: true, featureToggles: { chat: true } } } }
  const budgetRefusal = new SystemError('aiDailyBudgetExceeded', {}, 429)
  const chatBody = (stream = false) => ({ feature: 'chatbot', dataClass: 'schema', stream, call: { prompt } })

  /**
   * Builds the gateway dependencies; every step appends its name to `events`.
   * @param {object} [params] - Parameters.
   * @returns {object} The dependencies, the model and the recorded events.
   */
  const createDeps = ({
    source = 'admin-default',
    chargeError = null as unknown,
    overrides = {} as Record<string, unknown>,
  } = {}) => {
    const events: string[] = []
    const charges: any[] = []
    const telemetry: any[] = []
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        events.push('provider')
        return {
          content: [{ type: 'text', text: 'ok' }],
          finishReason: { unified: 'stop', raw: 'stop' },
          usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
          warnings: [],
        } as any
      },
    })
    const deps = {
      resolveModel: async () => ({ model, meta: { source, provider: 'openai', model: 'm' } }),
      assertPolicyAllows: async () => {
        events.push('policy')
      },
      chargeDailyBudget: async (args: any) => {
        events.push('charge')
        charges.push(args)
        if (chargeError) throw chargeError
      },
      rateLimiter: createRateLimiter({ limitPerMinute: 0 }),
      recordTelemetry: (_ctx: any, outcome: any) => telemetry.push(outcome),
      logError: () => {},
      limits: { maxPromptChars: 100000, maxOutputTokens: 100, timeoutMs: 5000 },
      gateEnv: { aiFeaturesEnabled: true, aiFeatureFlags: null },
      ...overrides,
    }
    return { deps, model, events, charges, telemetry }
  }

  /**
   * Runs one gateway request.
   * @param {object} body - Request body.
   * @param {object} deps - Dependencies.
   * @returns {Promise<object>} The fake response.
   */
  const run = async (body: unknown, deps: any) => {
    const res = createFakeResponse()
    await handleModelRequest({ req: createFakeRequest(body), res, user, deps })
    return res
  }

  test('a call with the Arena default is charged once, after the policy check and before the provider call', async () => {
    const { deps, events, charges } = createDeps()
    const res = await run(chatBody(), deps)
    expect(res.statusCode).toBe(200)
    expect(events).toEqual(['policy', 'charge', 'provider'])
    expect(charges).toEqual([{ userUuid: 'user-7', chars: 'Hello there'.length }])
  })

  test('a call with the provider of the user is not charged', async () => {
    const { deps, events, charges } = createDeps({ source: 'user' })
    const res = await run(chatBody(), deps)
    expect(res.statusCode).toBe(200)
    expect(events).toEqual(['policy', 'provider'])
    expect(charges).toEqual([])
  })

  test('over the budget: 429 aiDailyBudgetExceeded, the provider is not called', async () => {
    const { deps, model, telemetry } = createDeps({ chargeError: budgetRefusal })
    const res = await run(chatBody(), deps)
    expect(res.statusCode).toBe(429)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiDailyBudgetExceeded' })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect(telemetry).toEqual([])
  })

  test('over the budget in streaming mode: a JSON 429 before any stream is opened', async () => {
    const { deps, model } = createDeps({ chargeError: budgetRefusal })
    const res = await run(chatBody(true), deps)
    expect(res.statusCode).toBe(429)
    expect(parseSseWrites(res)).toEqual([])
    expect(res.body.key).toBe('aiDailyBudgetExceeded')
    expect(model.doStreamCalls).toHaveLength(0)
  })

  test('a call refused earlier does not use the budget (policy, rate limit, invalid call)', async () => {
    const policy = createDeps({
      overrides: {
        assertPolicyAllows: async () => {
          throw new SystemError('aiPolicyBlocked', {}, StatusCodes.FORBIDDEN)
        },
      },
    })
    await run(chatBody(), policy.deps)
    expect(policy.charges).toEqual([])

    const limited = createDeps({ overrides: { rateLimiter: { take: () => false } } })
    await run(chatBody(), limited.deps)
    expect(limited.charges).toEqual([])

    const invalid = createDeps()
    await run({ ...chatBody(), call: { prompt: [] } }, invalid.deps)
    expect(invalid.charges).toEqual([])
  })

  test('without a charger (the budget is not wired) the gateway still answers', async () => {
    const { deps } = createDeps({ overrides: { chargeDailyBudget: undefined } })
    const res = await run(chatBody(), deps)
    expect(res.statusCode).toBe(200)
  })

  test('the production gateway has the budget wired', () => {
    expect(typeof createDefaultModelGatewayDeps().chargeDailyBudget).toBe('function')
  })

  test('the limits default to 200 calls and 2 million characters a day', () => {
    expect([ENV.aiDefaultDailyCallLimit, ENV.aiDefaultDailyCharLimit]).toEqual([200, 2000000])
  })

  test('a batch run stops at once when the budget is gone: every following call would be refused', () => {
    expect(isRunStoppingError(budgetRefusal)).toBe(true)
  })
})
