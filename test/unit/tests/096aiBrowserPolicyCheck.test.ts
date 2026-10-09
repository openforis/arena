import { MockLanguageModelV4 } from 'ai/test'

import { createPolicyContextLoader } from '@webapp/ai/policy/policyContextLoader'
import { resolveGatewayModel } from '@webapp/ai/runtime/resolveModel'

const surveyState = (effective: any) => ({ policy: effective, ceilings: effective, effective, canEdit: false })

const createDeps = (context: any) => {
  const calls = { context: [] as any[], model: [] as any[] }
  const gatewayModel = new MockLanguageModelV4()
  return {
    calls,
    gatewayModel,
    deps: {
      loadPolicyContext: async (params: any) => {
        calls.context.push(params)
        return context
      },
      loadGatewayModel: async (params: any) => {
        calls.model.push(params)
        return gatewayModel
      },
    },
  }
}

const catchError = async (promise: Promise<unknown>): Promise<any> => {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('expected a rejection')
}

describe('resolveGatewayModel policy check', () => {
  test('an injected model skips the check', async () => {
    const model = new MockLanguageModelV4()
    const { deps, calls } = createDeps({ effective: { schema: 'off', data: 'off' }, hostingClass: 'cloud' })
    expect(await resolveGatewayModel({ model, feature: 'activityLogSummary', surveyId: 1 }, deps)).toBe(model)
    expect(calls.context).toEqual([])
  })

  test('refuses before loading the gateway model', async () => {
    const { deps, calls } = createDeps({ effective: { schema: 'cloud', data: 'onDevice' }, hostingClass: 'cloud' })
    const error = await catchError(resolveGatewayModel({ feature: 'activityLogSummary', surveyId: 1 }, deps))
    expect(error.key).toBe('aiPolicyRefused')
    expect(error.params).toEqual({ dataClass: 'data', hostingClass: 'cloud', allowed: 'onDevice' })
    expect(calls.context).toEqual([{ surveyId: 1 }])
    expect(calls.model).toEqual([])
  })

  test('an allowed feature gets the gateway model', async () => {
    const { deps, calls, gatewayModel } = createDeps({
      effective: { schema: 'cloud', data: 'onDevice' },
      hostingClass: 'cloud',
    })
    expect(await resolveGatewayModel({ feature: 'expressionGenerate', surveyId: 1 }, deps)).toBe(gatewayModel)
    expect(calls.model).toEqual([{ feature: 'expressionGenerate', surveyId: 1 }])
  })

  test('an organisation server is allowed up to orgHosted', async () => {
    const { deps, gatewayModel } = createDeps({
      effective: { schema: 'orgHosted', data: 'orgHosted' },
      hostingClass: 'orgHosted',
    })
    expect(await resolveGatewayModel({ feature: 'activityLogSummary', surveyId: 1 }, deps)).toBe(gatewayModel)
  })

  test('no configured provider → aiNotConfigured, no model loaded', async () => {
    const { deps, calls } = createDeps({ effective: { schema: 'cloud', data: 'cloud' }, hostingClass: null })
    const error = await catchError(resolveGatewayModel({ feature: 'expressionGenerate', surveyId: 1 }, deps))
    expect(error.key).toBe('aiNotConfigured')
    expect(calls.model).toEqual([])
  })
})

describe('createPolicyContextLoader', () => {
  const settings = { hostingClass: 'cloud', policyCeilings: { schema: 'orgHosted', data: 'cloud' } }

  test('a survey feature uses the survey effective policy', async () => {
    const load = createPolicyContextLoader({
      fetchSettings: async () => settings,
      fetchSurveyPolicy: async () => surveyState({ schema: 'off', data: 'onDevice' }) as any,
    })
    expect(await load({ surveyId: 4 })).toEqual({
      effective: { schema: 'off', data: 'onDevice' },
      hostingClass: 'cloud',
    })
  })

  test('without a survey the instance ceilings apply', async () => {
    const surveyCalls: number[] = []
    const load = createPolicyContextLoader({
      fetchSettings: async () => settings,
      fetchSurveyPolicy: async (surveyId: number) => {
        surveyCalls.push(surveyId)
        return surveyState({ schema: 'off', data: 'off' }) as any
      },
    })
    expect(await load({ surveyId: null })).toEqual({
      effective: { schema: 'orgHosted', data: 'cloud' },
      hostingClass: 'cloud',
    })
    expect(surveyCalls).toEqual([])
  })

  test('settings without ceilings fail closed', async () => {
    const load = createPolicyContextLoader({
      fetchSettings: async () => ({ featuresEnabled: false }),
      fetchSurveyPolicy: async () => surveyState({ schema: 'cloud', data: 'cloud' }) as any,
    })
    expect(await load({})).toEqual({ effective: { schema: 'off', data: 'off' }, hostingClass: null })
  })
})
