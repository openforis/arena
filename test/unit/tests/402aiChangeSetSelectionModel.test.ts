import type { ChangeOperation, ChangeSet } from '@webapp/ai/changeSets/types'
import type { ReviewItem } from '@webapp/components/ai/Assistant/changeSetReviewModel'
import {
  getBehaviourOperationIds,
  getInitialDeselectedIds,
  setDeselected,
  summarizeSelection,
  toggleDeselected,
} from '@webapp/components/ai/Assistant/changeSetSelectionModel'

const operations = [
  { id: 'a', type: 'label.set', nodeDefUuid: 'n1', kind: 'labels', lang: 'fr', from: null, to: 'x' },
  { id: 'b', type: 'expression.set', nodeDefUuid: 'n1', prop: 'visibleIf', from: [], to: [{ expression: 'true' }] },
  { id: 'c', type: 'nodeDef.update', nodeDefUuid: 'n1', prop: 'readOnly', from: false, to: true },
  { id: 'd', type: 'label.set', nodeDefUuid: 'n2', kind: 'descriptions', lang: 'fr', from: null, to: 'y' },
  { id: 'e', type: 'categoryItem.labelSet', categoryUuid: 'c1', ref: '1', lang: 'fr', text: 'z' },
] as unknown as ChangeOperation[]

const changeSet: ChangeSet = { id: 'cs', surveyId: 1, summary: '', operations, createdAt: '' }

const item = (id: string, key: string, params: Record<string, string> = {}): ReviewItem =>
  ({ id, field: { key, params }, name: id, groupKey: `entity:${id}`, groupName: id }) as unknown as ReviewItem

describe('change set selection model (402)', () => {
  test('expression and property changes are the ones that change how the survey behaves', () => {
    expect(getBehaviourOperationIds(changeSet)).toEqual(['b', 'c'])
  })

  test('a long change set starts with the behaviour changes unselected, a short one with everything selected', () => {
    expect(getInitialDeselectedIds({ changeSet, compact: true })).toEqual(['b', 'c'])
    expect(getInitialDeselectedIds({ changeSet, compact: false })).toEqual([])
  })

  test('toggling an id adds it to and removes it from the deselected ids', () => {
    expect(toggleDeselected(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleDeselected(['a', 'b'], 'a')).toEqual(['b'])
  })

  test('setDeselected selects or deselects a group of ids without duplicates', () => {
    expect(setDeselected(['a', 'b'], ['b', 'c'], true)).toEqual(['a'])
    expect(setDeselected(['a', 'b'], ['b', 'c'], false)).toEqual(['a', 'b', 'c'])
  })

  test('the summary of a selection counts the selected changes by kind, in order of first appearance', () => {
    const items = [
      item('a', 'aiAssistant.card.label', { lang: 'fr' }),
      item('b', 'aiAssistant.card.expressionProps.visibleIf'),
      item('d', 'aiAssistant.card.label', { lang: 'fr' }),
      item('e', 'aiAssistant.card.label', { lang: 'es' }),
    ]
    expect(summarizeSelection(items, ['a', 'd', 'e'])).toEqual([
      { label: { key: 'aiAssistant.card.label', params: { lang: 'fr' } }, count: 2 },
      { label: { key: 'aiAssistant.card.label', params: { lang: 'es' } }, count: 1 },
    ])
    expect(summarizeSelection(items, [])).toEqual([])
  })
})
