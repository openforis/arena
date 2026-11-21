/**
 * Which changes of a card start selected, and what a selection contains (pure). A long change set is reviewed in a
 * dialog, so its changes that alter how the survey behaves (expressions, properties) start unselected: Apply all
 * can't apply one of them unseen among many label changes.
 */
import type { ChangeSet } from '@webapp/ai/changeSets/types'

import { groupReviewItems, type ReviewItem, type ReviewLabel } from './changeSetReviewModel'

const BEHAVIOUR_OPERATION_TYPES = new Set(['expression.set', 'nodeDef.update'])

/**
 * Returns the changes that alter how the survey behaves: expressions, and properties such as key and category.
 * @param {ChangeSet} changeSet - Change set.
 * @returns {string[]} Operation ids.
 */
export const getBehaviourOperationIds = (changeSet: ChangeSet): string[] =>
  changeSet.operations.filter((op) => BEHAVIOUR_OPERATION_TYPES.has(op.type)).map((op) => op.id)

/**
 * Returns the operations that start unselected.
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - Change set.
 * @param {boolean} params.compact - The change set is reviewed in the dialog (not every change is listed on the card).
 * @returns {string[]} Operation ids: the behaviour changes of a compact card, none otherwise.
 */
export const getInitialDeselectedIds = ({
  changeSet,
  compact,
}: {
  changeSet: ChangeSet
  compact: boolean
}): string[] => (compact ? getBehaviourOperationIds(changeSet) : [])

/**
 * Toggles an operation in the list of the unselected ones.
 * @param {string[]} deselected - Unselected operations.
 * @param {string} id - Operation.
 * @returns {string[]} The new list.
 */
export const toggleDeselected = (deselected: string[], id: string): string[] =>
  deselected.includes(id) ? deselected.filter((item) => item !== id) : [...deselected, id]

/**
 * Selects or deselects a group of operations.
 * @param {string[]} deselected - Unselected operations.
 * @param {string[]} ids - Operations of the group.
 * @param {boolean} selected - True to select them, false to deselect them.
 * @returns {string[]} The new list of unselected operations.
 */
export const setDeselected = (deselected: string[], ids: string[], selected: boolean): string[] =>
  selected ? deselected.filter((id) => !ids.includes(id)) : [...new Set([...deselected, ...ids])]

/**
 * Counts the selected changes by kind (what the confirmation of Apply all lists).
 * @param {ReviewItem[]} items - Changes of the card.
 * @param {string[]} selectedIds - Selected operations.
 * @returns {{label: ReviewLabel, count: number}[]} One entry per kind of change, in order of first appearance.
 */
export const summarizeSelection = (
  items: ReviewItem[],
  selectedIds: string[]
): { label: ReviewLabel; count: number }[] =>
  groupReviewItems(
    items.filter((item) => selectedIds.includes(item.id)),
    'field'
  ).map((group) => ({ label: group.label, count: group.items.length }))
