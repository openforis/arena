import {
  AiDataClass,
  AiFeatureCategory,
  AiFeaturePermission,
  AiFeatures,
  getAiFeature,
  isGatewayFeature,
} from '@common/ai/features'
import { AiLimits } from '@common/ai/limits'

describe('AI feature registry', () => {
  const allFeatures = Object.values(AiFeatures)

  test('every feature declares its key, data class and permission', () => {
    for (const feature of allFeatures) {
      expect(AiFeatures[feature.key]).toBe(feature)
      expect(Object.values(AiDataClass)).toContain(feature.dataClass)
      expect(Object.values(AiFeaturePermission)).toContain(feature.permission)
    }
  })

  test('every gateway feature has a user-facing category', () => {
    for (const feature of allFeatures.filter((f) => f.gateway)) {
      expect(Object.values(AiFeatureCategory)).toContain(feature.category)
    }
  })

  test('only browser features are accepted by the gateway', () => {
    expect(
      allFeatures
        .filter((f) => f.gateway)
        .map((f) => f.key)
        .sort()
    ).toEqual(
      [
        'activityLogSummary',
        'assistantAnalysis',
        'assistantDesign',
        'chatbot',
        'dataQueryGenerate',
        'dataQuerySummarize',
        'expressionExplain',
        'expressionGenerate',
        'translation',
      ].sort()
    )
    expect(isGatewayFeature('dataDictionary')).toBe(false)
    expect(isGatewayFeature('internalPing')).toBe(false)
    expect(isGatewayFeature('nope')).toBe(false)
  })

  test('the data dictionary job uses the documented flag key', () => {
    expect(getAiFeature('dataDictionary')?.category).toBe(AiFeatureCategory.dataDictionary)
    expect(getAiFeature('schemaSummary')).toBeNull()
  })

  test('survey-scoped permissions match the spec', () => {
    expect(AiFeatures.expressionGenerate.permission).toBe(AiFeaturePermission.surveyEdit)
    expect(AiFeatures.expressionExplain.permission).toBe(AiFeaturePermission.surveyEdit)
    expect(AiFeatures.translation.permission).toBe(AiFeaturePermission.surveyEdit)
    expect(AiFeatures.dataQueryGenerate.permission).toBe(AiFeaturePermission.recordListView)
    expect(AiFeatures.dataQuerySummarize.permission).toBe(AiFeaturePermission.recordListView)
    expect(AiFeatures.activityLogSummary.permission).toBe(AiFeaturePermission.surveyView)
    expect(AiFeatures.chatbot.permission).toBe(AiFeaturePermission.loggedIn)
  })

  test('limits are positive integers', () => {
    for (const value of Object.values(AiLimits)) {
      expect(Number.isInteger(value) && value > 0).toBe(true)
    }
  })
})
