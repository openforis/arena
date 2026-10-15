import { createPolicyContextLoader } from '@webapp/ai/policy/policyContextLoader'

/** Returns a survey policy client state with the given effective policy. */
const surveyState = (effective: any) => ({ policy: effective, ceilings: effective, effective, canEdit: false })

describe('createPolicyContextLoader', () => {
  const settings = { policyCeilings: { schema: 'cloud', data: 'orgHosted' } }

  test('a survey feature uses the survey effective policy; the hosting class is left to the engine', async () => {
    const load = createPolicyContextLoader({
      // an old server response still names a hosting class: it is not used
      fetchSettings: async () => ({ ...settings, hostingClass: 'cloud' }),
      fetchSurveyPolicy: async () => surveyState({ schema: 'off', data: 'onDevice' }) as any,
    })
    expect(await load({ surveyId: 4 })).toEqual({
      effective: { schema: 'off', data: 'onDevice' },
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
      effective: { schema: 'cloud', data: 'orgHosted' },
    })
    expect(surveyCalls).toEqual([])
  })

  test('ceilings that allow more for the data than for the design are clamped to the design level', async () => {
    const load = createPolicyContextLoader({
      fetchSettings: async () => ({ policyCeilings: { schema: 'onDevice', data: 'cloud' } }),
      fetchSurveyPolicy: async () => surveyState({ schema: 'off', data: 'off' }) as any,
    })
    expect(await load({ surveyId: null })).toEqual({ effective: { schema: 'onDevice', data: 'onDevice' } })
  })

  test('settings without ceilings fail closed', async () => {
    const load = createPolicyContextLoader({
      fetchSettings: async () => ({ featuresEnabled: false }),
      fetchSurveyPolicy: async () => surveyState({ schema: 'cloud', data: 'cloud' }) as any,
    })
    expect(await load({})).toEqual({ effective: { schema: 'off', data: 'off' } })
  })
})
