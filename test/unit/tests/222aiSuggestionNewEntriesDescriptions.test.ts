import * as NodeDef from '@core/survey/nodeDef'

import { SUGGESTION_DEFINITIONS } from '@webapp/ai/suggestions/registry'
import { newEntriesDescriptionsDefinition } from '@webapp/ai/suggestions/definitions/newEntriesDescriptions'
import { EVENT_DETECTORS, TARGET_RESOLVERS } from '@webapp/ai/suggestions/registry'
import {
  newEntriesDescriptionsDetector,
  newEntriesDescriptionsResolver,
} from '@webapp/ai/suggestions/detectors/newEntriesDescriptions'
import { buildAssistantSurvey, getDefByName } from '@test/unit/utils/assistantTestUtils'
import {
  TEST_NOW,
  buildSuggestion,
  createAddRecorder,
  createDetectorContext,
  describeContext,
  withNodeDef,
  withSavedNodeDefs,
  withTexts,
} from '@test/unit/utils/designSuggestionTestUtils'

let survey: any

// no node definition has a description
beforeAll(async () => {
  survey = withSavedNodeDefs(await buildAssistantSurvey({ languages: ['en', 'fr'] }))
})

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))

const leaveDesigner = (target: any, names: string[], options: { draft?: boolean } = {}) => {
  const { store, added } = createAddRecorder()
  const event = { type: 'designerLeft' as const, newNodeDefUuids: names.map(uuidOf) }
  newEntriesDescriptionsDetector.handle(event, createDetectorContext({ survey: target, store, ...options }))
  return added
}

describe('new entries descriptions detector (222)', () => {
  test('adds the new entries without a description in any language', () => {
    const changed = withTexts(survey, 'cluster_notes', 'descriptions', { fr: 'Remarques' })
    expect(leaveDesigner(changed, ['tree_dec_1', 'cluster_notes', 'tree'])).toEqual([
      {
        id: 'newEntriesDescriptions:visit',
        kind: 'newEntriesDescriptions',
        area: 'design',
        surveyId: 7,
        cycle: null,
        targets: [{ key: uuidOf('tree_dec_1') }, { key: uuidOf('tree') }],
        createdAt: TEST_NOW.toISOString(),
        expiresAt: null,
      },
    ])
  })

  test('only saved, eligible node definitions; nothing to add, nothing added', () => {
    let changed = withNodeDef(survey, 'tree_dec_1', (nodeDef) => ({ ...nodeDef, temporary: true }))
    changed = withNodeDef(changed, 'plot_id', (nodeDef) => ({ ...nodeDef, analysis: true }))
    changed = withNodeDef(changed, 'cluster_id', (nodeDef) => ({ ...nodeDef, deleted: true }))
    expect(leaveDesigner(changed, ['tree_dec_1', 'plot_id', 'cluster_id'])).toEqual([])
    expect(leaveDesigner(survey, [])).toEqual([])
  })

  test('ignores other events, published defs and unknown uuids', () => {
    const { store, added } = createAddRecorder()
    newEntriesDescriptionsDetector.handle({ type: 'publishClicked' }, createDetectorContext({ survey, store }))
    newEntriesDescriptionsDetector.handle(
      { type: 'designerLeft', newNodeDefUuids: ['no-such-uuid'] },
      createDetectorContext({ survey, store })
    )
    expect(added).toEqual([])
    expect(leaveDesigner(survey, ['tree_dec_1'], { draft: false })).toEqual([])
  })

  test('the resolver drops entries that have a description, or are gone', () => {
    const changed = withTexts(survey, 'tree_dec_1', 'descriptions', { fr: 'Diamètre' })
    expect(newEntriesDescriptionsResolver.isResolved(uuidOf('tree_dec_1'), changed)).toBe(true)
    expect(newEntriesDescriptionsResolver.isResolved(uuidOf('tree'), changed)).toBe(false)
    expect(newEntriesDescriptionsResolver.isResolved('no-such-uuid', changed)).toBe(true)
  })

  test('is registered as a Design event detector on designerLeft, with its resolver', () => {
    expect(EVENT_DETECTORS).toContain(newEntriesDescriptionsDetector)
    expect(newEntriesDescriptionsDetector).toMatchObject({
      kind: 'newEntriesDescriptions',
      area: 'design',
      needsDraft: true,
      on: ['designerLeft'],
    })
    expect(TARGET_RESOLVERS).toContain(newEntriesDescriptionsResolver)
  })
})

describe('new entries descriptions card and prompt (222)', () => {
  const suggestion = buildSuggestion('newEntriesDescriptions', 'visit', ['a', 'b'])

  test('the card counts the visible targets', () => {
    expect(newEntriesDescriptionsDefinition.card(suggestion, describeContext(survey))).toEqual({
      key: 'newEntriesDescriptions.card',
      params: { count: 2 },
    })
  })

  test('the prompt names the survey languages', () => {
    expect(newEntriesDescriptionsDefinition.prompt(suggestion, describeContext(survey))).toBe(
      'Write a short description (one sentence, for the data collector) for each new entry, in every survey ' +
        'language (en (English), fr (French)). List them with survey_listMissingTexts (kind descriptions, ' +
        'onlyEmpty), read each one with nodeDef_get, and propose them with labels_proposeSet, kind descriptions, at ' +
        'most 4 batches. Then say how many remain. If some remain, end with "Say *continue* for the next batches."'
    )
  })

  test('is registered', () => {
    expect(SUGGESTION_DEFINITIONS.newEntriesDescriptions).toBe(newEntriesDescriptionsDefinition)
  })
})
