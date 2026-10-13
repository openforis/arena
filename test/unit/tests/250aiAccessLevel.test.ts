// test/unit/tests/250aiAccessLevel.test.ts
import {
  AI_ACCESS_LEVELS,
  aiCategoryAccessRanks,
  deriveAiAccessLevel,
  getAiCategoriesOfRank,
  getAiCategoryAccessRank,
  isAiAccessLevel,
  isCategoryWithinAccessLevel,
  raiseAccessLevelToggles,
  resolveAiAccessLevel,
} from '@common/ai/accessLevel'
import { AiFeatureCategory } from '@common/ai/features'

import { FEATURE_GROUPS } from '@webapp/components/ai/UserAiSettingsPanel/featureGroups'

const allOff = Object.fromEntries(Object.values(AiFeatureCategory).map((category) => [category, false])) as Record<
  string,
  boolean
>

describe('access level (250)', () => {
  test('the levels are 0 to 3', () => {
    expect(AI_ACCESS_LEVELS).toEqual([0, 1, 2, 3])
    expect(isAiAccessLevel(2)).toBe(true)
    for (const value of [4, -1, 1.5, '2', null, undefined, NaN]) {
      expect([value, isAiAccessLevel(value)]).toEqual([value, false])
    }
  })

  test('every category has a rank, and the ranks follow the panel groups', () => {
    expect(Object.keys(aiCategoryAccessRanks).sort()).toEqual(Object.values(AiFeatureCategory).sort())
    for (const [index, group] of FEATURE_GROUPS.entries()) {
      for (const category of group.categories) {
        expect([category, aiCategoryAccessRanks[category]]).toEqual([category, index + 1])
      }
    }
    expect(getAiCategoryAccessRank('unknown')).toBeNull()
    expect(getAiCategoriesOfRank(1).sort()).toEqual(['assistantSuggestions', 'chat'])
  })

  test('a category is within a level when its rank is not above it', () => {
    expect(isCategoryWithinAccessLevel('chat', 0)).toBe(false)
    expect(isCategoryWithinAccessLevel('chat', 1)).toBe(true)
    expect(isCategoryWithinAccessLevel('expressions', 1)).toBe(false)
    expect(isCategoryWithinAccessLevel('expressions', 2)).toBe(true)
    expect(isCategoryWithinAccessLevel('assistantCleaning', 2)).toBe(false)
    expect(isCategoryWithinAccessLevel('assistantCleaning', 3)).toBe(true)
    expect(isCategoryWithinAccessLevel('unknown', 3)).toBe(false)
  })

  test('old settings convert to the level that keeps every enabled toggle', () => {
    expect(deriveAiAccessLevel({ featuresEnabled: false, featureToggles: { assistantCleaning: true } })).toBe(0)
    expect(deriveAiAccessLevel({ featuresEnabled: true, featureToggles: {} })).toBe(1)
    expect(deriveAiAccessLevel({ featuresEnabled: true, featureToggles: undefined })).toBe(1)
    expect(deriveAiAccessLevel({ featuresEnabled: true, featureToggles: { chat: true } })).toBe(1)
    expect(deriveAiAccessLevel({ featuresEnabled: true, featureToggles: { chat: true, translation: true } })).toBe(2)
    expect(deriveAiAccessLevel({ featuresEnabled: true, featureToggles: { userActivity: true } })).toBe(3)
    // only true counts
    expect(deriveAiAccessLevel({ featuresEnabled: true, featureToggles: { userActivity: 'yes' } as any })).toBe(1)
  })

  test('a valid stored level wins; anything else is derived', () => {
    expect(
      resolveAiAccessLevel({ accessLevel: 2, featuresEnabled: true, featureToggles: { userActivity: true } })
    ).toBe(2)
    expect(resolveAiAccessLevel({ accessLevel: 0, featuresEnabled: true, featureToggles: {} })).toBe(0)
    expect(resolveAiAccessLevel({ accessLevel: 7, featuresEnabled: true, featureToggles: { translation: true } })).toBe(
      2
    )
    expect(resolveAiAccessLevel({ accessLevel: '3', featuresEnabled: false, featureToggles: {} })).toBe(0)
  })

  test('raising the level switches on the newly included ranks only', () => {
    const custom: Record<string, boolean> = { ...allOff, chat: true, assistantSuggestions: false, expressions: true }
    const raised = raiseAccessLevelToggles({ from: 1, to: 3, toggles: custom })
    // rank 1 was already included: kept as customized
    expect(raised.assistantSuggestions).toBe(false)
    // ranks 2 and 3 newly included: all on
    for (const category of [...getAiCategoriesOfRank(2), ...getAiCategoriesOfRank(3)]) {
      expect([category, raised[category]]).toEqual([category, true])
    }
    // the input is not changed
    expect(custom.translation).toBe(false)
  })

  test('lowering or keeping the level changes no toggle', () => {
    const custom = { ...allOff, chat: true, assistantCleaning: true }
    expect(raiseAccessLevelToggles({ from: 3, to: 1, toggles: custom })).toEqual(custom)
    expect(raiseAccessLevelToggles({ from: 2, to: 2, toggles: custom })).toEqual(custom)
    expect(raiseAccessLevelToggles({ from: 0, to: 1, toggles: allOff })).toMatchObject({
      chat: true,
      assistantSuggestions: true,
      expressions: false,
    })
  })
})
