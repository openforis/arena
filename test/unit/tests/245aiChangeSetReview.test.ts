import * as NodeDef from '@core/survey/nodeDef'

import { buildChangeSet } from '@webapp/ai/changeSets/buildChangeSet'
import { createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import type { ChangeOperationDraft, ChangeSetCardState } from '@webapp/ai/changeSets/types'
import {
  COMPACT_CARD_MAX_INLINE,
  buildReviewItems,
  filterReviewItems,
  getReviewLabelText,
  getSelectionState,
  getValuePreview,
  groupReviewItems,
  isCompactCard,
  toggleSelection,
  type ReviewItem,
} from '@webapp/components/ai/Assistant/changeSetReviewModel'
import { buildAssistantSurvey, getDefByName } from '@test/unit/utils/assistantTestUtils'
import {
  buildCategoryLabelsSurvey,
  categoryLabelChangeSet,
  categoryLabelOp,
  categoryUuidOf,
} from '@test/unit/utils/categoryLabelsTestUtils'

let survey: any

beforeAll(async () => {
  survey = await buildAssistantSurvey({ languages: ['en', 'it'] })
})

const uuidOf = (name: string): string => NodeDef.getUuid(getDefByName(survey, name))

const label = (name: string, to: string, kind: 'labels' | 'descriptions' = 'labels'): ChangeOperationDraft => ({
  type: 'label.set',
  nodeDefUuid: uuidOf(name),
  kind,
  lang: 'it',
  from: null,
  to,
})

const cardOf = (drafts: ChangeOperationDraft[], extra: Partial<ChangeSetCardState> = {}): ChangeSetCardState => {
  // the first id is the change set's, then op0, op1...
  let next = -1
  const idFactory = () => (next++ < 0 ? 'cs' : `op${next - 1}`)
  return {
    changeSet: buildChangeSet({ survey, summary: 'Italian', drafts, idFactory }),
    ...extra,
  }
}

const itemsOf = (drafts: ChangeOperationDraft[]): ReviewItem[] =>
  buildReviewItems({ cardState: cardOf(drafts), survey, lang: 'en' })

describe('change set review (245)', () => {
  test('the compact card shows above the inline limit', () => {
    expect(COMPACT_CARD_MAX_INLINE).toBe(5)
    expect(isCompactCard(5)).toBe(false)
    expect(isCompactCard(6)).toBe(true)
  })

  test('items: one per operation, in its entity (an entity is its own group, a new item is in its parent)', () => {
    const remarks = createProposedNodeDef({
      parent: getDefByName(survey, 'plot'),
      type: 'text',
      cycle: '0',
      name: 'plot_remarks',
      labels: { en: 'Remarks' },
    })
    const items = itemsOf([
      label('cluster_id', 'ID grappolo'),
      label('plot', 'Parcella'),
      label('tree_dec_1', 'Diametro', 'descriptions'),
      { type: 'nodeDef.create', nodeDef: remarks, parentUuid: uuidOf('plot') },
    ])
    expect(items.map(({ id, name, groupName }) => ({ id, name, groupName }))).toEqual([
      { id: 'op0', name: 'cluster_id', groupName: 'cluster' },
      { id: 'op1', name: 'plot', groupName: 'plot' },
      { id: 'op2', name: 'tree_dec_1', groupName: 'tree' },
      { id: 'op3', name: 'plot_remarks', groupName: 'plot' },
    ])
    expect(items[0]).toMatchObject({
      nodeDefUuid: uuidOf('cluster_id'),
      field: { key: 'aiAssistant.card.label', params: { lang: 'it' } },
      from: { kind: 'text', text: null },
      to: { kind: 'text', text: 'ID grappolo' },
    })
  })

  test('category labels: one item per label, grouped by their category', async () => {
    const labelsSurvey = await buildCategoryLabelsSurvey()
    const speciesUuid = categoryUuidOf(labelsSurvey, 'species')
    const cardState: ChangeSetCardState = {
      changeSet: categoryLabelChangeSet([
        categoryLabelOp({ id: 'c1', categoryUuid: speciesUuid, ref: '1', text: 'Pino' }),
      ]),
    }
    const [item] = buildReviewItems({ cardState, survey: labelsSurvey, lang: 'en' })
    expect(item).toMatchObject({
      id: 'c1',
      nodeDefUuid: null,
      groupName: 'species',
      field: { key: 'aiAssistant.card.label', params: { lang: 'fr' } },
      to: { kind: 'text', text: 'Pino' },
    })
    expect(item).toMatchObject({ name: '1', detail: 'genus', groupKey: `category:${speciesUuid}` })
    expect(groupReviewItems([item], 'entity')[0].label).toEqual({
      key: 'aiAssistant.card.review.categoryGroup',
      params: { name: 'species' },
    })
  })

  test('groups: by entity or by kind of change, in order of first appearance', () => {
    const items = itemsOf([
      label('cluster_id', 'ID grappolo'),
      label('plot_id', 'ID parcella'),
      label('cluster_notes', 'Note', 'descriptions'),
    ])
    const byEntity = groupReviewItems(items, 'entity')
    expect(byEntity.map((group) => [group.key, group.items.map((item) => item.id)])).toEqual([
      [`entity:${uuidOf('cluster')}`, ['op0', 'op2']],
      [`entity:${uuidOf('plot')}`, ['op1']],
    ])
    expect(byEntity[0].label).toEqual({ text: 'cluster' })
    const byField = groupReviewItems(items, 'field')
    expect(byField.map((group) => [group.label, group.items.map((item) => item.id)])).toEqual([
      [{ key: 'aiAssistant.card.label', params: { lang: 'it' } }, ['op0', 'op1']],
      [{ key: 'aiAssistant.card.description', params: { lang: 'it' } }, ['op2']],
    ])
  })

  test('filters: selected, conflicts and a case-insensitive search on names and texts', () => {
    const items = itemsOf([
      label('cluster_id', 'ID grappolo'),
      label('plot_id', 'ID parcella'),
      label('cluster_notes', 'Note'),
    ])
    const base = { selectedIds: ['op0', 'op2'], conflictIds: ['op1'], search: '' }
    const ids = (list: ReviewItem[]) => list.map((item) => item.id)
    expect(ids(filterReviewItems(items, { ...base, filter: 'all' }))).toEqual(['op0', 'op1', 'op2'])
    expect(ids(filterReviewItems(items, { ...base, filter: 'selected' }))).toEqual(['op0', 'op2'])
    expect(ids(filterReviewItems(items, { ...base, filter: 'conflicts' }))).toEqual(['op1'])
    expect(ids(filterReviewItems(items, { ...base, filter: 'all', search: 'PARCELLA' }))).toEqual(['op1'])
    expect(ids(filterReviewItems(items, { ...base, filter: 'all', search: 'cluster_' }))).toEqual(['op0', 'op2'])
    expect(ids(filterReviewItems(items, { ...base, filter: 'selected', search: 'id' }))).toEqual(['op0'])
  })

  test('selection state of a group: all, some or none of its selectable items; disabled without any', () => {
    const selectable = ['a', 'b', 'c']
    expect(getSelectionState({ ids: ['a', 'b'], selectedIds: ['a', 'b'], selectableIds: selectable })).toBe('all')
    expect(getSelectionState({ ids: ['a', 'b'], selectedIds: ['a'], selectableIds: selectable })).toBe('some')
    expect(getSelectionState({ ids: ['a', 'b'], selectedIds: [], selectableIds: selectable })).toBe('none')
    // a conflicting item is not selectable: it doesn't keep the group from being all selected
    expect(getSelectionState({ ids: ['a', 'x'], selectedIds: ['a'], selectableIds: selectable })).toBe('all')
    expect(getSelectionState({ ids: ['x'], selectedIds: [], selectableIds: selectable })).toBe('disabled')
  })

  test('toggling a group selects its selectable items, or deselects them all when they all were selected', () => {
    const selectable = ['a', 'b', 'c']
    expect(toggleSelection({ ids: ['a', 'b', 'x'], selectedIds: ['a'], selectableIds: selectable })).toEqual({
      ids: ['a', 'b'],
      selected: true,
    })
    expect(toggleSelection({ ids: ['a', 'b'], selectedIds: ['a', 'b', 'c'], selectableIds: selectable })).toEqual({
      ids: ['a', 'b'],
      selected: false,
    })
  })

  test('label texts and one-line value previews', () => {
    const t = (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key)
    expect(getReviewLabelText({ text: 'plot' }, t)).toBe('plot')
    expect(getReviewLabelText({ key: 'k', params: { lang: 'it' } }, t)).toBe('k {"lang":"it"}')
    expect(getValuePreview({ kind: 'text', text: 'Parcella' }, t)).toBe('Parcella')
    expect(getValuePreview({ kind: 'text', text: null }, t)).toBe('aiAssistant.card.empty')
    expect(getValuePreview({ kind: 'boolean', value: true }, t)).toBe('aiAssistant.card.yes')
    const expressions = [
      { expression: 'a > 0', applyIf: null },
      { expression: 'b', applyIf: 'c' },
    ]
    expect(getValuePreview({ kind: 'expressions', items: expressions }, t)).toBe('a > 0; b')
  })
})
