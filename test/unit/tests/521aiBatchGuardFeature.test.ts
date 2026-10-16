import { createAiBatchGuard } from '@webapp/ai/workflows/batchRun'

const settingsOn = { accessLevel: 2, featuresEnabled: true, featureToggles: { dataDictionary: true } }
const cloudPolicy = { schema: 'cloud', data: 'onDevice' } as const

describe('AI batch guard reads the policy of its feature (521)', () => {
  test('the batch feature and the survey go to the policy reader', async () => {
    const reads: [number, string][] = []
    const guard = createAiBatchGuard({
      feature: 'dataDictionary',
      surveyId: 9,
      dataClass: 'schema',
      hostingClass: 'cloud',
      deps: {
        fetchSettings: async () => settingsOn,
        fetchEffectivePolicy: async (surveyId: number, feature: string) => {
          reads.push([surveyId, feature])
          return cloudPolicy
        },
      },
    })
    await guard()
    await guard()
    expect(reads).toEqual([
      [9, 'dataDictionary'],
      [9, 'dataDictionary'],
    ])
  })
})
