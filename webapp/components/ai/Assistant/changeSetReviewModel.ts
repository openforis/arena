/**
 * Review of a long change set (pure): above COMPACT_CARD_MAX_INLINE changes the chat shows a compact card and the
 * changes are reviewed in a dialog, grouped by entity (category labels by category) or by kind of change.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import type { ChangeOperation, ChangeSetCardState, OperationResult } from '@webapp/ai/changeSets/types'

import { buildCategoryLabelGroups } from './categoryLabelCardModel'
import { buildCardRows, findNodeDefName, type CardDetail, type CardValue } from './changeSetCardModel'

// up to this many changes the card lists them in the chat
export const COMPACT_CARD_MAX_INLINE = 5

// translated with t(key, params), or shown as it is (names)
export type ReviewLabel = { text: string } | { key: string; params: Record<string, string> }

export type ReviewItem = {
  id: string
  // node definition name, or the code path of a category item
  name: string
  // level of a category item
  detail: string | null
  // shown in the form designer on click; null for category items
  nodeDefUuid: string | null
  field: { key: string; params: Record<string, string> }
  from: CardValue | null
  to: CardValue
  // what a new node definition sets besides its type, name and label
  details?: CardDetail[]
  result: OperationResult | null
  // entity:<uuid> or category:<uuid>
  groupKey: string
  groupName: string
}

export type ReviewGroupBy = 'entity' | 'field'

export type ReviewGroup = { key: string; label: ReviewLabel; items: ReviewItem[] }

export type ReviewFilter = 'all' | 'selected' | 'conflicts'

export type SelectionState = 'all' | 'some' | 'none' | 'disabled'

/**
 * Tells whether a change set is long enough for the compact card and the review dialog.
 * @param {number} count - Changes on the card.
 * @returns {boolean} True above COMPACT_CARD_MAX_INLINE.
 */
export const isCompactCard = (count: number): boolean => count > COMPACT_CARD_MAX_INLINE

/**
 * Returns the entity a node definition change belongs to: an entity itself, the parent of an attribute.
 * @param {ChangeOperation|undefined} op - Operation of the row.
 * @param {string} nodeDefUuid - Node definition of the row.
 * @param {ChangeOperation[]} operations - Operations of the change set (parents of new items).
 * @param {object} survey - Survey.
 * @returns {string} The entity uuid.
 */
const getEntityUuid = (
  op: ChangeOperation | undefined,
  nodeDefUuid: string,
  operations: ChangeOperation[],
  survey: any
): string => {
  if (op?.type === 'nodeDef.create') return op.parentUuid
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  if (nodeDef) return NodeDef.isEntity(nodeDef) ? nodeDefUuid : NodeDef.getParentUuid(nodeDef)
  // created in this change set
  const create = operations.find(
    (item) => item.type === 'nodeDef.create' && NodeDef.getUuid(item.nodeDef) === nodeDefUuid
  )
  return create?.type === 'nodeDef.create' ? create.parentUuid : nodeDefUuid
}

/**
 * Returns the review items of a card: node definition changes, then category labels, in proposal order.
 * @param {object} params - Parameters.
 * @param {ChangeSetCardState} params.cardState - Card state.
 * @param {object} params.survey - Current survey.
 * @param {string} params.lang - Survey preferred language (label of a new node definition).
 * @returns {ReviewItem[]} One item per operation.
 */
export const buildReviewItems = ({
  cardState,
  survey,
  lang,
}: {
  cardState: ChangeSetCardState
  survey: any
  lang: string
}): ReviewItem[] => {
  const { changeSet } = cardState
  const opsById = new Map(changeSet.operations.map((op) => [op.id, op]))
  const nodeDefItems = buildCardRows({ cardState, survey, lang }).map((row): ReviewItem => {
    const entityUuid = getEntityUuid(opsById.get(row.id), row.nodeDefUuid, changeSet.operations, survey)
    return {
      id: row.id,
      name: row.nodeDefName,
      detail: null,
      nodeDefUuid: row.nodeDefUuid,
      field: { key: row.titleKey, params: row.titleParams },
      from: row.from,
      to: row.to,
      details: row.details,
      result: row.result,
      groupKey: `entity:${entityUuid}`,
      groupName: findNodeDefName(entityUuid, changeSet, survey),
    }
  })
  const categoryItems = buildCategoryLabelGroups({ cardState, survey }).flatMap((group) =>
    group.rows.map((row): ReviewItem => ({
      id: row.id,
      name: row.ref,
      detail: row.levelName,
      nodeDefUuid: null,
      field: { key: 'aiAssistant.card.label', params: { lang: row.lang } },
      from: { kind: 'text', text: row.from },
      to: { kind: 'text', text: row.to },
      result: row.result,
      groupKey: `category:${group.categoryUuid}`,
      groupName: group.categoryName,
    }))
  )
  return [...nodeDefItems, ...categoryItems]
}

/**
 * Returns the group of an item.
 * @param {ReviewItem} item - Item.
 * @param {ReviewGroupBy} groupBy - Grouping.
 * @returns {{key: string, label: ReviewLabel}} The group key and label.
 */
const getItemGroup = (item: ReviewItem, groupBy: ReviewGroupBy): { key: string; label: ReviewLabel } => {
  if (groupBy === 'field') {
    return { key: `field:${item.field.key}:${JSON.stringify(item.field.params)}`, label: item.field }
  }
  const label: ReviewLabel = item.groupKey.startsWith('category:')
    ? { key: 'aiAssistant.card.review.categoryGroup', params: { name: item.groupName } }
    : { text: item.groupName }
  return { key: item.groupKey, label }
}

/**
 * Groups items by entity or by kind of change.
 * @param {ReviewItem[]} items - Items.
 * @param {ReviewGroupBy} groupBy - Grouping.
 * @returns {ReviewGroup[]} The groups, in order of first appearance.
 */
export const groupReviewItems = (items: ReviewItem[], groupBy: ReviewGroupBy): ReviewGroup[] => {
  const groups = new Map<string, ReviewGroup>()
  for (const item of items) {
    const { key, label } = getItemGroup(item, groupBy)
    const group = groups.get(key) ?? { key, label, items: [] }
    group.items.push(item)
    groups.set(key, group)
  }
  return [...groups.values()]
}

/**
 * Returns the searchable texts of a value.
 * @param {CardValue|null} value - Value.
 * @returns {string[]} Its texts.
 */
const valueTexts = (value: CardValue | null): string[] => {
  if (value?.kind === 'text') return value.text ? [value.text] : []
  if (value?.kind === 'expressions') return value.items.flatMap((item) => [item.expression, item.applyIf ?? ''])
  return []
}

/**
 * Tells whether an item matches a search text (name, level, group and values).
 * @param {ReviewItem} item - Item.
 * @param {string} search - Lower case search text.
 * @returns {boolean} True when one of its texts contains it.
 */
const matchesSearch = (item: ReviewItem, search: string): boolean =>
  [item.name, item.detail ?? '', item.groupName, ...valueTexts(item.from), ...valueTexts(item.to)].some((text) =>
    text.toLowerCase().includes(search)
  )

/**
 * Filters items by selection, conflicts and a search text.
 * @param {ReviewItem[]} items - Items.
 * @param {object} params - Parameters.
 * @param {ReviewFilter} params.filter - All, selected or conflicts.
 * @param {string} params.search - Search text (case insensitive; blank: no search).
 * @param {string[]} params.selectedIds - Selected operations.
 * @param {string[]} params.conflictIds - Conflicting operations.
 * @returns {ReviewItem[]} The items shown.
 */
export const filterReviewItems = (
  items: ReviewItem[],
  {
    filter,
    search,
    selectedIds,
    conflictIds,
  }: { filter: ReviewFilter; search: string; selectedIds: string[]; conflictIds: string[] }
): ReviewItem[] => {
  const text = search.trim().toLowerCase()
  return items.filter((item) => {
    if (filter === 'selected' && !selectedIds.includes(item.id)) return false
    if (filter === 'conflicts' && !conflictIds.includes(item.id)) return false
    return !text || matchesSearch(item, text)
  })
}

/**
 * Returns the checkbox state of a group of items.
 * @param {object} params - Parameters.
 * @param {string[]} params.ids - Items of the group.
 * @param {string[]} params.selectedIds - Selected operations.
 * @param {string[]} params.selectableIds - Operations that can be selected (pending, no conflict).
 * @returns {SelectionState} All, some or none of its selectable items; disabled without any.
 */
export const getSelectionState = ({
  ids,
  selectedIds,
  selectableIds,
}: {
  ids: string[]
  selectedIds: string[]
  selectableIds: string[]
}): SelectionState => {
  const selectable = ids.filter((id) => selectableIds.includes(id))
  if (selectable.length === 0) return 'disabled'
  const selected = selectable.filter((id) => selectedIds.includes(id)).length
  if (selected === selectable.length) return 'all'
  return selected > 0 ? 'some' : 'none'
}

/**
 * Returns what a click on a group checkbox does.
 * @param {object} params - Parameters.
 * @param {string[]} params.ids - Items of the group.
 * @param {string[]} params.selectedIds - Selected operations.
 * @param {string[]} params.selectableIds - Operations that can be selected.
 * @returns {{ids: string[], selected: boolean}} The selectable items and whether they get selected (false when they
 * all were).
 */
export const toggleSelection = ({
  ids,
  selectedIds,
  selectableIds,
}: {
  ids: string[]
  selectedIds: string[]
  selectableIds: string[]
}): { ids: string[]; selected: boolean } => ({
  ids: ids.filter((id) => selectableIds.includes(id)),
  selected: getSelectionState({ ids, selectedIds, selectableIds }) !== 'all',
})

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * Returns the text of a review label.
 * @param {ReviewLabel} label - Label.
 * @param {Function} t - Translation function.
 * @returns {string} The text.
 */
export const getReviewLabelText = (label: ReviewLabel, t: Translate): string =>
  'text' in label ? label.text : t(label.key, label.params)

/**
 * Returns a value on one line (the preview rows of the compact card).
 * @param {CardValue} value - Value.
 * @param {Function} t - Translation function.
 * @returns {string} The text; "(empty)" for a blank value.
 */
export const getValuePreview = (value: CardValue, t: Translate): string => {
  if (value.kind === 'boolean') return t(value.value ? 'aiAssistant.card.yes' : 'aiAssistant.card.no')
  const text = value.kind === 'text' ? value.text : value.items.map((item) => item.expression).join('; ')
  return text || t('aiAssistant.card.empty')
}
