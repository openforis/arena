import { AiFeatureCategory, AiFeaturePermission, AiFeatures } from '@common/ai/features'
import { defaultAiPolicy } from '@common/ai/policy'

import { FEATURE_GROUPS } from '@webapp/components/ai/UserAiSettingsPanel/featureGroups'

describe('feature groups', () => {
  test('in order: no survey content, survey design, record data', () => {
    expect(FEATURE_GROUPS.map((group) => group.id)).toEqual(['noSurveyContent', 'surveyDesign', 'recordData'])
  })

  test('every category is in exactly one group', () => {
    const grouped = FEATURE_GROUPS.flatMap((group) => group.categories)
    expect([...grouped].sort()).toEqual(Object.values(AiFeatureCategory).sort())
  })

  test("a group's data class is the data class of its features (the Help chat reads no survey)", () => {
    for (const group of FEATURE_GROUPS) {
      for (const feature of Object.values(AiFeatures)) {
        if (!feature.category || !group.categories.includes(feature.category)) continue
        const expected = feature.permission === AiFeaturePermission.loggedIn ? null : feature.dataClass
        expect([feature.key, group.dataClass]).toEqual([feature.key, expected])
      }
    }
  })

  test('the hints describe the default survey AI policy', () => {
    for (const group of FEATURE_GROUPS) {
      const expected = group.dataClass ? defaultAiPolicy[group.dataClass] : 'none'
      expect([group.id, group.hintKey]).toEqual([group.id, expected])
    }
  })
})
