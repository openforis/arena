import { isAiCategoryAvailable } from '@common/ai/features'
import { getDisabledFeatureKeys } from '@server/modules/ai/service/featureGate'

describe('AI feature availability', () => {
  test('env flags disable features', () => {
    const env = { aiFeaturesEnabled: true, aiFeatureFlags: { chatbot: false, translation: true } }
    expect(getDisabledFeatureKeys(env)).toEqual(['chatbot'])
    expect(getDisabledFeatureKeys({ aiFeaturesEnabled: true, aiFeatureFlags: null })).toEqual([])
  })

  test('a category is available while one of its features is', () => {
    expect(isAiCategoryAvailable('chat', ['chatbot'])).toBe(false)
    expect(isAiCategoryAvailable('expressions', ['expressionGenerate'])).toBe(true)
    expect(isAiCategoryAvailable('expressions', ['expressionGenerate', 'expressionExplain'])).toBe(false)
    expect(isAiCategoryAvailable('dataQuery', [])).toBe(true)
  })
})
