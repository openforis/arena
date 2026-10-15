import type { AiPolicy } from '@common/ai/policy'
import { resolveAssistantEngine } from '@webapp/ai/engines/assistantEngine'
import type { AiSelectedEngine } from '@webapp/ai/engines/types'
import { createEffectivePolicyReader, OFF_POLICY } from '@webapp/ai/policy/effectivePolicy'

const SURVEY_POLICY: AiPolicy = { schema: 'cloud', data: 'onDevice' }
const CEILINGS = { schema: 'cloud', data: 'orgHosted' }

const setup = ({
  surveyPolicy = SURVEY_POLICY as AiPolicy,
  settings = { policyCeilings: CEILINGS } as { policyCeilings?: unknown } | null,
  surveyError = null as Error | null,
} = {}) => {
  const surveyCalls: { surveyId: number; fresh: boolean }[] = []
  let settingsCalls = 0
  const getEffectivePolicyFor = createEffectivePolicyReader({
    fetchSurveyPolicy: async (surveyId, { fresh }) => {
      surveyCalls.push({ surveyId, fresh })
      if (surveyError) throw surveyError
      return { effective: surveyPolicy }
    },
    fetchSettings: async () => {
      settingsCalls += 1
      return settings
    },
  })
  return { getEffectivePolicyFor, surveyCalls, getSettingsCalls: () => settingsCalls }
}

describe('getEffectivePolicyFor: one rule for the engine, the tools, the badge and the batch guard (364)', () => {
  test('a survey feature uses the survey effective policy', async () => {
    const { getEffectivePolicyFor, surveyCalls, getSettingsCalls } = setup()
    expect(await getEffectivePolicyFor({ feature: 'expressionExplain', surveyId: 4 })).toEqual(SURVEY_POLICY)
    expect(surveyCalls).toEqual([{ surveyId: 4, fresh: false }])
    expect(getSettingsCalls()).toBe(0)
  })

  test('fresh is passed to the survey policy read', async () => {
    const { getEffectivePolicyFor, surveyCalls } = setup()
    await getEffectivePolicyFor({ feature: 'activityLogSummary', surveyId: 4, fresh: true })
    expect(surveyCalls).toEqual([{ surveyId: 4, fresh: true }])
  })

  test('a survey feature without a survey is off', async () => {
    const { getEffectivePolicyFor, surveyCalls } = setup()
    expect(await getEffectivePolicyFor({ feature: 'expressionExplain' })).toEqual(OFF_POLICY)
    expect(await getEffectivePolicyFor({ feature: 'expressionExplain', surveyId: null })).toEqual(OFF_POLICY)
    expect(surveyCalls).toEqual([])
  })

  test('the Help chat uses the instance ceilings, even when a survey is open', async () => {
    const { getEffectivePolicyFor, surveyCalls } = setup()
    expect(await getEffectivePolicyFor({ feature: 'chatbot', surveyId: 4 })).toEqual(CEILINGS)
    expect(await getEffectivePolicyFor({ feature: 'chatbot' })).toEqual(CEILINGS)
    expect(surveyCalls).toEqual([])
  })

  test('without a feature the survey decides: its policy with a survey, the ceilings without', async () => {
    const { getEffectivePolicyFor } = setup()
    expect(await getEffectivePolicyFor({ surveyId: 4 })).toEqual(SURVEY_POLICY)
    expect(await getEffectivePolicyFor({ surveyId: null })).toEqual(CEILINGS)
    expect(await getEffectivePolicyFor({})).toEqual(CEILINGS)
  })

  test('ceilings that are missing (settings failed) or garbled fail closed', async () => {
    expect(await setup({ settings: null }).getEffectivePolicyFor({ feature: 'chatbot' })).toEqual(OFF_POLICY)
    expect(await setup({ settings: {} }).getEffectivePolicyFor({ feature: 'chatbot' })).toEqual(OFF_POLICY)
    expect(
      await setup({ settings: { policyCeilings: 'cloud' } }).getEffectivePolicyFor({ feature: 'chatbot' })
    ).toEqual(OFF_POLICY)
  })

  test('ceilings with data above schema are clamped', async () => {
    const { getEffectivePolicyFor } = setup({ settings: { policyCeilings: { schema: 'onDevice', data: 'cloud' } } })
    expect(await getEffectivePolicyFor({ feature: 'chatbot' })).toEqual({ schema: 'onDevice', data: 'onDevice' })
  })

  test('a failed survey policy read rejects: the caller fails closed', async () => {
    const { getEffectivePolicyFor } = setup({ surveyError: new Error('network') })
    await expect(getEffectivePolicyFor({ feature: 'expressionExplain', surveyId: 4 })).rejects.toThrow('network')
  })

  test('OFF_POLICY cannot be changed by a caller', () => {
    expect(Object.isFrozen(OFF_POLICY)).toBe(true)
  })
})

describe('resolveAssistantEngine: the turn uses the policy the engine was selected with (364)', () => {
  const engine: AiSelectedEngine = {
    id: 'gateway',
    hostingClass: 'cloud',
    label: 'openai',
    model: 'm',
    limits: { maxPromptChars: 1000, maxSteps: 5 },
  }
  const limits = { maxPromptChars: 1000, maxSteps: 5 }

  test("the access carries the resolver's policy, not the one loaded before the turn", async () => {
    const checked: AiPolicy = { schema: 'orgHosted', data: 'off' }
    const result = await resolveAssistantEngine({
      defaultLimits: limits,
      access: { effective: { schema: 'cloud', data: 'cloud' } },
      feature: 'assistantDesign',
      surveyId: 7,
      dataClass: 'schema',
      resolve: async () => ({ model: 'm', engine, policy: checked }),
    })
    expect(result.access).toEqual({ effective: checked, hostingClass: 'cloud' })
  })

  test('a resolver that reports no policy leaves the access as it was', async () => {
    const result = await resolveAssistantEngine({
      defaultLimits: limits,
      access: { effective: { schema: 'cloud', data: 'cloud' } },
      feature: 'assistantDesign',
      surveyId: 7,
      dataClass: 'schema',
      resolve: async () => ({ model: 'm', engine }),
    })
    expect(result.access).toEqual({ effective: { schema: 'cloud', data: 'cloud' }, hostingClass: 'cloud' })
  })
})
