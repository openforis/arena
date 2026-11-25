import * as Survey from '@core/survey/survey'
import { buildCategoryLabelsSurvey, categoryUuidOf } from '@test/unit/utils/categoryLabelsTestUtils'
import { describeContext, TEST_NOW } from '@test/unit/utils/designSuggestionTestUtils'
import { categoryItemTranslationsDefinition } from '@webapp/ai/suggestions/definitions/categoryItemTranslations'
import { getLanguageDisplayName } from '@webapp/ai/suggestions/definitions/missingTranslations'
import {
  categoryItemTranslationsResolver,
  detectCategoryItemTranslations,
} from '@webapp/ai/suggestions/detectors/categoryItemTranslations'
import { SUGGESTION_DEFINITIONS } from '@webapp/ai/suggestions/registry'
import { TARGET_RESOLVERS } from '@webapp/ai/suggestions/registry'
import { buildSuggestionRequest } from '@webapp/ai/suggestions/suggestionActions'

let survey: any
let speciesUuid: string
let landUseUuid: string

beforeAll(async () => {
  survey = await buildCategoryLabelsSurvey()
  speciesUuid = categoryUuidOf(survey, 'species')
  landUseUuid = categoryUuidOf(survey, 'land_use')
})

/**
 * Returns the survey without one of its categories.
 * @param {string} categoryUuid - Category to drop.
 * @returns {object} The survey.
 */
const withoutCategory = (categoryUuid: string): any =>
  Survey.assocCategories(
    Object.fromEntries(
      Survey.getCategoriesArray(survey)
        .filter((category: any) => category.uuid !== categoryUuid)
        .map((category: any) => [category.uuid, category])
    )
  )(survey)

describe('category item translations suggestion (236)', () => {
  test('one suggestion per survey language with missing labels; targets are the survey categories by name, with their counts', () => {
    const counts = {
      // de: a language the survey does not have
      [speciesUuid]: { en: 0, fr: 3, es: 0, de: 4 },
      [landUseUuid]: { fr: 2, es: 1 },
      // a category deleted since
      'gone-category': { fr: 9 },
    }
    const suggestions = detectCategoryItemTranslations(counts, survey, { surveyId: 7, now: TEST_NOW })
    expect(suggestions).toEqual([
      {
        id: 'categoryItemTranslations:fr',
        kind: 'categoryItemTranslations',
        area: 'design',
        surveyId: 7,
        cycle: null,
        targets: [
          { key: landUseUuid, count: 2 },
          { key: speciesUuid, count: 3 },
        ],
        createdAt: TEST_NOW.toISOString(),
        expiresAt: null,
      },
      expect.objectContaining({ id: 'categoryItemTranslations:es', targets: [{ key: landUseUuid, count: 1 }] }),
    ])
    expect(detectCategoryItemTranslations({}, survey, { surveyId: 7, now: TEST_NOW })).toEqual([])
  })

  test('a target is resolved when its category is deleted', () => {
    expect(categoryItemTranslationsResolver.isResolved(speciesUuid, survey)).toBe(false)
    expect(categoryItemTranslationsResolver.isResolved(speciesUuid, withoutCategory(speciesUuid))).toBe(true)
    expect(TARGET_RESOLVERS).toContain(categoryItemTranslationsResolver)
  })

  test('the card counts the labels of the visible targets, in the language named in the interface language', () => {
    const [suggestion] = detectCategoryItemTranslations(
      { [speciesUuid]: { fr: 3 }, [landUseUuid]: { fr: 2 } },
      survey,
      { surveyId: 7, now: TEST_NOW }
    )
    expect(categoryItemTranslationsDefinition.card(suggestion, describeContext(survey, 'es'))).toEqual({
      key: 'categoryItemTranslations.card',
      params: { count: 5, language: getLanguageDisplayName('fr', 'es') },
    })
    // the store hands visible targets only
    const visible = { ...suggestion, targets: suggestion.targets.filter((target) => target.key === speciesUuid) }
    expect(categoryItemTranslationsDefinition.card(visible, describeContext(survey)).params.count).toBe(3)
    expect(SUGGESTION_DEFINITIONS.categoryItemTranslations).toBe(categoryItemTranslationsDefinition)
  })

  test('Do it builds the request of the chat batch: the language as the scope key, the categories as targets', () => {
    const [suggestion] = detectCategoryItemTranslations({ [speciesUuid]: { fr: 3 } }, survey, {
      surveyId: 7,
      now: TEST_NOW,
    })
    const request = buildSuggestionRequest({
      suggestion,
      userUuid: 'u1',
      surveyId: 7,
      cycle: '0',
      describeContext: describeContext(survey),
    })
    expect(request?.scope).toEqual({ kind: 'categoryItemTranslations', key: 'fr', targetKeys: [speciesUuid] })
    expect(request?.prompt).toBe('Translate the category item labels that are missing in French (fr).')
  })
})
