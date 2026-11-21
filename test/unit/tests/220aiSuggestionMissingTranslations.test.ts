import * as NodeDef from '@core/survey/nodeDef'

import { SUGGESTION_DEFINITIONS } from '@webapp/ai/suggestions/registry'
import { missingTranslationsDefinition } from '@webapp/ai/suggestions/definitions/missingTranslations'
import { STATE_DETECTORS } from '@webapp/ai/suggestions/registry'
import {
  detectMissingTranslations,
  missingTranslationsDetector,
} from '@webapp/ai/suggestions/detectors/missingTranslations'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'
import { buildAssistantSurvey, getDefByName } from '@test/unit/utils/assistantTestUtils'
import {
  TEST_NOW,
  buildSuggestion,
  createDetectorContext,
  describeContext,
  withLanguages,
  withNodeDef,
  withSavedNodeDefs,
  withTexts,
} from '@test/unit/utils/designSuggestionTestUtils'

let survey: any

// cluster, cluster_id, cluster_notes, plot, plot_id and tree_dec_1 have an English label; tree has none
beforeAll(async () => {
  survey = withSavedNodeDefs(await buildAssistantSurvey({ languages: ['en', 'fr'] }))
})

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))
const labelKeys = (names: string[]) => names.map((name) => `${uuidOf(name)}:labels`)
const keysOf = (suggestion: AssistantSuggestion | undefined) => (suggestion?.targets ?? []).map((target) => target.key)
const detect = (target: any) => detectMissingTranslations(createDetectorContext({ survey: target }))

describe('missing translations detector (220)', () => {
  test('one suggestion per missing language, a target per text filled in another language', () => {
    const suggestions = detect(survey)
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]).toEqual({
      id: 'missingTranslations:fr',
      kind: 'missingTranslations',
      area: 'design',
      surveyId: 7,
      cycle: null,
      targets: expect.any(Array),
      createdAt: TEST_NOW.toISOString(),
      expiresAt: null,
    })
    // tree has no label in any language: that is not a translation (the new entries suggestion covers them)
    expect(keysOf(suggestions[0])).toEqual(
      labelKeys(['cluster', 'cluster_id', 'cluster_notes', 'plot', 'plot_id', 'tree_dec_1'])
    )
  })

  test('a blank text is missing; a filled one is not', () => {
    let changed = withTexts(survey, 'cluster_id', 'labels', { en: 'Cluster id', fr: 'Identifiant' })
    changed = withTexts(changed, 'cluster_notes', 'labels', { en: 'Notes', fr: '   ' })
    const keys = keysOf(detect(changed)[0])
    expect(keys).not.toContain(`${uuidOf('cluster_id')}:labels`)
    expect(keys).toContain(`${uuidOf('cluster_notes')}:labels`)
  })

  test('a text filled only in the second language is missing in the default one', () => {
    const changed = withTexts(survey, 'tree', 'descriptions', { fr: 'Arbres mesurés' })
    const english = detect(changed).find((suggestion) => suggestion.id === 'missingTranslations:en')
    expect(keysOf(english)).toEqual([`${uuidOf('tree')}:descriptions`])
  })

  test('analysis, deleted and unsaved node definitions are skipped', () => {
    let changed = withNodeDef(survey, 'cluster_notes', (nodeDef) => ({ ...nodeDef, analysis: true }))
    changed = withNodeDef(changed, 'plot_id', (nodeDef) => ({ ...nodeDef, deleted: true }))
    changed = withNodeDef(changed, 'tree_dec_1', (nodeDef) => ({ ...nodeDef, temporary: true }))
    expect(keysOf(detect(changed)[0])).toEqual(labelKeys(['cluster', 'cluster_id', 'plot']))
  })

  test('one language, no generation, published defs loaded or no edit right: nothing', () => {
    expect(detect(withLanguages(survey, ['en']))).toEqual([])
    expect(detectMissingTranslations(createDetectorContext({ survey, noGeneration: true }))).toEqual([])
    expect(detectMissingTranslations(createDetectorContext({ survey, draft: false }))).toEqual([])
    expect(detectMissingTranslations(createDetectorContext({ survey, canEditSurvey: false }))).toEqual([])
  })

  test('is registered as a Design state detector that needs the draft', () => {
    expect(STATE_DETECTORS).toContain(missingTranslationsDetector)
    expect(missingTranslationsDetector).toMatchObject({ kind: 'missingTranslations', area: 'design', needsDraft: true })
  })
})

describe('missing translations card and prompt (220)', () => {
  const suggestion = buildSuggestion('missingTranslations', 'fr', ['a:labels', 'b:descriptions'])

  test('the card counts the visible targets and names the language in the interface language', () => {
    expect(missingTranslationsDefinition.card(suggestion, describeContext(survey))).toEqual({
      key: 'missingTranslations.card',
      params: { count: 2, language: 'French' },
    })
    expect(missingTranslationsDefinition.card(suggestion, describeContext(survey, 'es')).params.language).toBe(
      'francés'
    )
  })

  test('the prompt is the fixed English text, with the continue rule', () => {
    expect(missingTranslationsDefinition.prompt(suggestion, describeContext(survey, 'es'))).toBe(
      'Translate the survey texts that are missing in French (fr). Get them with survey_listMissingTexts and ' +
        'propose each batch with labels_proposeSet, at most 4 batches. Keep the meaning, the tone and any terms ' +
        'that are codes or units. Then say how many remain. If some remain, end with "Say *continue* for the next ' +
        'batches."'
    )
  })

  test('is registered', () => {
    expect(SUGGESTION_DEFINITIONS.missingTranslations).toBe(missingTranslationsDefinition)
  })
})
