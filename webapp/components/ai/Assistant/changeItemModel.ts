/**
 * What every row of a change set shares, whatever it shows it in (pure): the kind of item, and the items of a card
 * split into node definition changes and category label groups.
 */
import type { OperationResult } from '@webapp/ai/changeSets/types'

import type { ReviewItem } from './changeSetReviewModel'

const CATEGORY_GROUP_PREFIX = 'category:'

export type CategoryItemGroup = { categoryUuid: string; categoryName: string; items: ReviewItem[] }

/**
 * Tells whether an item is a category item label (it has no node definition to show in the form designer).
 * @param {ReviewItem} item - Item.
 * @returns {boolean} True for a category item.
 */
export const isCategoryItem = (item: ReviewItem): boolean => item.nodeDefUuid === null

/**
 * Returns the category of a category item.
 * @param {ReviewItem} item - Category item.
 * @returns {string} The category uuid.
 */
export const getCategoryUuid = (item: ReviewItem): string => item.groupKey.slice(CATEGORY_GROUP_PREFIX.length)

/**
 * Returns the language of a label change.
 * @param {ReviewItem} item - Item.
 * @returns {string} The language code (blank for changes that are not about a language).
 */
export const getItemLang = (item: ReviewItem): string => item.field.params.lang ?? ''

/**
 * Splits the items of a card: node definition changes, and the category labels grouped by category.
 * @param {ReviewItem[]} items - Items of the card.
 * @returns {{nodeDefItems: ReviewItem[], categoryGroups: CategoryItemGroup[]}} Both lists, in order of appearance.
 */
export const splitReviewItems = (
  items: ReviewItem[]
): { nodeDefItems: ReviewItem[]; categoryGroups: CategoryItemGroup[] } => {
  const nodeDefItems: ReviewItem[] = []
  const groups = new Map<string, CategoryItemGroup>()
  for (const item of items) {
    if (!isCategoryItem(item)) {
      nodeDefItems.push(item)
      continue
    }
    const categoryUuid = getCategoryUuid(item)
    const group = groups.get(categoryUuid) ?? { categoryUuid, categoryName: item.groupName, items: [] }
    group.items.push(item)
    groups.set(categoryUuid, group)
  }
  return { nodeDefItems, categoryGroups: [...groups.values()] }
}

/**
 * Returns the tooltip of a result: its message, and the text found when a label had changed since the proposal.
 * @param {OperationResult|null} result - Result of an Apply.
 * @returns {string|undefined} The title.
 */
export const getResultTitle = (result: OperationResult | null): string | undefined => {
  if (!result) return undefined
  const currentText = result.status === 'conflict' ? result.params?.currentText : null
  const parts = [result.message, typeof currentText === 'string' ? currentText : null]
  return parts.filter(Boolean).join(': ') || undefined
}
