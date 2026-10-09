import { createPolicyContextLoader } from '@webapp/ai/policy/policyContextLoader'

const surveyState = (effective: any) => ({ policy: effective, ceilings: effective, effective, canEdit: false })

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
