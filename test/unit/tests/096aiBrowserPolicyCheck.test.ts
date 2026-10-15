import { createEffectivePolicyReader } from '@webapp/ai/policy/effectivePolicy'

/** Returns a survey policy client state with the given effective policy. */
const surveyState = (effective: any) => ({ policy: effective, ceilings: effective, effective, canEdit: false })

describe('createEffectivePolicyReader (browser policy check)', () => {
  const settings = { policyCeilings: { schema: 'cloud', data: 'orgHosted' } }

  test('a survey feature uses the survey effective policy; the hosting class is left to the engine', async () => {
    const read = createEffectivePolicyReader({
      // an old server response still names a hosting class: it is not used
      fetchSettings: async () => ({ ...settings, hostingClass: 'cloud' }),
      fetchSurveyPolicy: async () => surveyState({ schema: 'onDevice', data: 'off' }) as any,
    })
    expect(await read({ surveyId: 4 })).toEqual({ schema: 'onDevice', data: 'off' })
  })

  test('without a survey the instance ceilings apply', async () => {
    const surveyCalls: number[] = []
    const read = createEffectivePolicyReader({
      fetchSettings: async () => settings,
      fetchSurveyPolicy: async (surveyId: number) => {
        surveyCalls.push(surveyId)
        return surveyState({ schema: 'off', data: 'off' }) as any
      },
    })
    expect(await read({ surveyId: null })).toEqual({ schema: 'cloud', data: 'orgHosted' })
    expect(surveyCalls).toEqual([])
  })

  test('ceilings that allow more for the data than for the design are clamped to the design level', async () => {
    const read = createEffectivePolicyReader({
      fetchSettings: async () => ({ policyCeilings: { schema: 'onDevice', data: 'cloud' } }),
      fetchSurveyPolicy: async () => surveyState({ schema: 'off', data: 'off' }) as any,
    })
    expect(await read({ surveyId: null })).toEqual({ schema: 'onDevice', data: 'onDevice' })
  })

  test('settings without ceilings fail closed', async () => {
    const read = createEffectivePolicyReader({
      fetchSettings: async () => ({ featuresEnabled: false }),
      fetchSurveyPolicy: async () => surveyState({ schema: 'cloud', data: 'cloud' }) as any,
    })
    expect(await read({})).toEqual({ schema: 'off', data: 'off' })
  })
})
