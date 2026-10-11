import * as NodeDef from '@core/survey/nodeDef'

import { SUGGESTION_DEFINITIONS } from '@webapp/ai/suggestions/definitions'
import { getTargetNodeDefNames } from '@webapp/ai/suggestions/definitions/designTargetNames'
import { entityWithoutKeyDefinition } from '@webapp/ai/suggestions/definitions/entityWithoutKey'
import { EVENT_DETECTORS, TARGET_RESOLVERS } from '@webapp/ai/suggestions/detectors'
import {
  entityWithoutKeyDetector,
  entityWithoutKeyResolver,
  isEntityWithoutKey,
} from '@webapp/ai/suggestions/detectors/entityWithoutKey'
import { formatPromptList } from '@webapp/ai/suggestions/prompts/designPrompts'
import { buildAssistantSurvey, getDefByName } from '@test/unit/utils/assistantTestUtils'
import {
  buildSuggestion,
  createAddRecorder,
  createDetectorContext,
  describeContext,
  withNodeDef,
  withSavedNodeDefs,
} from '@test/unit/utils/designSuggestionTestUtils'

let survey: any

// plot (multiple) has the key plot_id; tree (multiple) has no key; cluster is the single root
beforeAll(async () => {
  survey = withSavedNodeDefs(await buildAssistantSurvey())
})

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))
const withKey = (target: any, name: string) =>
  withNodeDef(target, name, (nodeDef) => NodeDef.assocProp({ key: 'key', value: true })(nodeDef))

const leaveDesigner = (target: any, names: string[]) => {
  const { store, added } = createAddRecorder()
  const event = { type: 'designerLeft' as const, newNodeDefUuids: names.map(uuidOf) }
  entityWithoutKeyDetector.handle(event, createDetectorContext({ survey: target, store }))
  return added
}

describe('entity without a key detector (223)', () => {
  test('only multiple entities without a key among their direct children', () => {
    expect(isEntityWithoutKey(survey, getDefByName(survey, 'tree'))).toBe(true)
    expect(isEntityWithoutKey(survey, getDefByName(survey, 'plot'))).toBe(false)
    expect(isEntityWithoutKey(survey, getDefByName(survey, 'cluster'))).toBe(false)
    expect(isEntityWithoutKey(survey, getDefByName(survey, 'tree_dec_1'))).toBe(false)
    // a deleted key does not count
    const deletedKey = withNodeDef(survey, 'plot_id', (nodeDef) => ({ ...nodeDef, deleted: true }))
    expect(isEntityWithoutKey(deletedKey, getDefByName(deletedKey, 'plot'))).toBe(true)
  })

  test('adds the new entities without a key on leaving the designer', () => {
    const added = leaveDesigner(survey, ['tree', 'plot', 'cluster_id'])
    expect(added).toHaveLength(1)
    expect(added[0]).toMatchObject({ id: 'entityWithoutKey:visit', kind: 'entityWithoutKey', area: 'design' })
    expect(added[0].targets).toEqual([{ key: uuidOf('tree') }])
    expect(leaveDesigner(survey, ['plot'])).toEqual([])
    const unsaved = withNodeDef(survey, 'tree', (nodeDef) => ({ ...nodeDef, temporary: true }))
    expect(leaveDesigner(unsaved, ['tree'])).toEqual([])
  })

  test('the resolver drops entities that now have a key, or are gone', () => {
    expect(entityWithoutKeyResolver.isResolved(uuidOf('tree'), survey)).toBe(false)
    expect(entityWithoutKeyResolver.isResolved(uuidOf('tree'), withKey(survey, 'tree_dec_1'))).toBe(true)
    expect(entityWithoutKeyResolver.isResolved('no-such-uuid', survey)).toBe(true)
  })

  test('is registered as a Design event detector on designerLeft, with its resolver', () => {
    expect(EVENT_DETECTORS).toContain(entityWithoutKeyDetector)
    expect(entityWithoutKeyDetector).toMatchObject({ kind: 'entityWithoutKey', area: 'design', on: ['designerLeft'] })
    expect(TARGET_RESOLVERS).toContain(entityWithoutKeyResolver)
  })
})

describe('entity without a key card and prompt (223)', () => {
  test('one entity: its name; several: the count; a target that is gone is not named', () => {
    const one = buildSuggestion('entityWithoutKey', 'visit', [uuidOf('tree')])
    expect(entityWithoutKeyDefinition.card(one, describeContext(survey))).toEqual({
      key: 'entityWithoutKey.cardSingle',
      params: { name: 'tree' },
    })
    const two = buildSuggestion('entityWithoutKey', 'visit', [uuidOf('tree'), uuidOf('plot')])
    expect(entityWithoutKeyDefinition.card(two, describeContext(survey))).toEqual({
      key: 'entityWithoutKey.card',
      params: { count: 2 },
    })
    const gone = buildSuggestion('entityWithoutKey', 'visit', ['no-such-uuid'])
    expect(entityWithoutKeyDefinition.card(gone, describeContext(survey))).toEqual({
      key: 'entityWithoutKey.card',
      params: { count: 1 },
    })
    expect(getTargetNodeDefNames(two, null)).toEqual([])
  })

  test('the prompt quotes the names of the visible targets', () => {
    const two = buildSuggestion('entityWithoutKey', 'visit', [uuidOf('tree'), uuidOf('plot')])
    expect(entityWithoutKeyDefinition.prompt(two, describeContext(survey))).toBe(
      'These entities have no key attribute: "tree", "plot". Records of a multiple entity are told apart by their ' +
        'keys. Look at their attributes with nodeDef_get and propose which to mark as key with ' +
        'nodeDef_proposeUpdate (prop key). If none fits, propose a new attribute with nodeDef_proposeCreate.'
    )
  })

  test('a long list is cut with the number left out', () => {
    const items = Array.from({ length: 52 }, (_, index) => `n${index}`)
    const text = formatPromptList(items)
    expect(text.startsWith('n0, n1, ')).toBe(true)
    expect(text.endsWith('n49 and 2 more')).toBe(true)
  })

  test('is registered', () => {
    expect(SUGGESTION_DEFINITIONS.entityWithoutKey).toBe(entityWithoutKeyDefinition)
  })
})
