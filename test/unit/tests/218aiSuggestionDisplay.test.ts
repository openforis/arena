import { createI18nAsync } from '@core/i18n/i18nFactory'

import type { SuggestionDescribeContext } from '@webapp/ai/suggestions/definitions'
import { moduleIntroDefinition } from '@webapp/ai/suggestions/definitions/moduleIntro'
import { buildModuleIntroSuggestion } from '@webapp/ai/suggestions/detectors/moduleIntro'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'
import type { AssistantAreaStatus } from '@webapp/components/ai/Assistant/assistantAreas'
import {
  canDoIt,
  getAssistantButtonLabel,
  getAvailableAreas,
  getNextExpiryDelay,
  getSuggestionCardText,
  groupSuggestionsByArea,
  withDefinitions,
} from '@webapp/components/ai/Assistant/suggestions/suggestionsModel'
import { TestId } from '@webapp/utils/testId'

const NOW = new Date('2026-10-11T12:00:00.000Z')

const status = (area: AssistantAreaStatus['area'], value: AssistantAreaStatus['status']): AssistantAreaStatus => ({
  area,
  status: value,
  reasonKeys: [],
})

const suggestionOf = (
  id: string,
  area: AssistantSuggestion['area'],
  overrides: Partial<AssistantSuggestion> = {}
): AssistantSuggestion => ({
  id,
  kind: 'missingTranslations',
  area,
  surveyId: 7,
  cycle: null,
  targets: [{ key: id }],
  createdAt: NOW.toISOString(),
  expiresAt: null,
  ...overrides,
})

// a test-local registry: "a kind without a definition" must not depend on the real registry growing
const DEFINITIONS = { moduleIntro: moduleIntroDefinition }

const intro = buildModuleIntroSuggestion('designer', NOW)

describe('suggestion display (218)', () => {
  test('only available areas show suggestions (unavailable or hidden areas keep theirs in the store)', () => {
    const statuses = [
      status('design', 'unavailable'),
      status('analysis', 'available'),
      status('cleaning', 'hidden'),
      status('help', 'available'),
    ]
    expect(getAvailableAreas(statuses)).toEqual(['analysis', 'help'])
  })

  test('cards of a kind without a definition are not shown; the others are grouped by area, in order', () => {
    const design = suggestionOf('missingTranslations:x', 'design')
    const visible = withDefinitions([design, intro], DEFINITIONS)
    expect(visible).toEqual([intro])
    const second = { ...intro, id: 'moduleIntro:data', targets: [{ key: 'data' }] }
    expect(groupSuggestionsByArea([design, intro, second])).toEqual({ design: [design], help: [intro, second] })
    expect(groupSuggestionsByArea([])).toEqual({})
  })

  test('Do it is enabled only when the conversation store is ready and neither an answer nor an Apply runs', () => {
    expect(canDoIt({ ready: true, busy: false, applying: false })).toBe(true)
    expect(canDoIt({ ready: false, busy: false, applying: false })).toBe(false)
    expect(canDoIt({ ready: true, busy: true, applying: false })).toBe(false)
    expect(canDoIt({ ready: true, busy: false, applying: true })).toBe(false)
  })

  test('the button label counts the suggestions; without any it is the plain assistant label', async () => {
    const i18n = await createI18nAsync('en')
    const t = i18n.t.bind(i18n) as SuggestionDescribeContext['t']
    expect(getAssistantButtonLabel({ count: 0, t })).toBe('AI assistant')
    expect(getAssistantButtonLabel({ count: 1, t })).toBe('AI assistant: 1 suggestion')
    expect(getAssistantButtonLabel({ count: 3, t })).toBe('AI assistant: 3 suggestions')
  })

  test('card text: the definition key under aiSuggestions with its params; null when it cannot be described', async () => {
    const i18n = await createI18nAsync('en')
    const describeContext: SuggestionDescribeContext = {
      survey: null,
      t: i18n.t.bind(i18n) as SuggestionDescribeContext['t'],
      lang: 'en',
    }
    const params = { describeContext, definitions: DEFINITIONS }
    expect(getSuggestionCardText({ ...params, suggestion: intro })).toBe(
      'New to the form designer? Ask me how it works.'
    )
    expect(getSuggestionCardText({ ...params, suggestion: suggestionOf('missingTranslations:x', 'design') })).toBeNull()
    // a hand-edited module: its definition throws, the card is skipped instead of breaking the panel
    expect(getSuggestionCardText({ ...params, suggestion: { ...intro, targets: [{ key: 'users' }] } })).toBeNull()
  })

  test('the next expiry: the nearest future one, 0 once past, none without expiry or with an invalid date', () => {
    const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs).toISOString()
    const suggestions = [
      suggestionOf('a', 'design'),
      suggestionOf('b', 'design', { expiresAt: at(60_000) }),
      suggestionOf('c', 'design', { expiresAt: at(5_000) }),
    ]
    expect(getNextExpiryDelay(suggestions, NOW)).toBe(5_000)
    expect(getNextExpiryDelay([suggestionOf('d', 'design', { expiresAt: at(-1) })], NOW)).toBe(0)
    expect(getNextExpiryDelay([suggestionOf('e', 'design', { expiresAt: 'soon' })], NOW)).toBeNull()
    expect(getNextExpiryDelay([suggestionOf('f', 'design')], NOW)).toBeNull()
    // setTimeout's largest delay
    expect(getNextExpiryDelay([suggestionOf('g', 'design', { expiresAt: at(90 * 86_400_000) })], NOW)).toBe(
      2_147_483_647
    )
  })

  test('the suggestion test ids are plain strings (the e2e of Parts 2–4 use them as is)', () => {
    const ids = [
      'suggestionCard',
      'suggestionDismissBtn',
      'suggestionDoItBtn',
      'suggestions',
      'suggestionsDot',
      'tabDot',
    ]
    for (const id of ids) expect(typeof (TestId.aiAssistant as Record<string, unknown>)[id]).toBe('string')
  })
})
