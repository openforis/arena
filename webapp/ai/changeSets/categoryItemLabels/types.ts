/**
 * Category item label operations: one label of one item in one language. They take their own path
 * through preview, card, conflicts and Apply (one atomic server request), apart from node definition operations.
 */

export const CATEGORY_ITEM_LABEL_SET = 'categoryItemLabel.set'

export type CategoryItemLabelSetOperation = {
  id: string
  type: typeof CATEGORY_ITEM_LABEL_SET
  categoryUuid: string
  itemUuid: string
  // code path of the item ("2.14"), as listed to the model and shown on the card
  ref: string
  levelName: string
  lang: string
  text: string
  // the label in lang when the item was listed (null: blank); Apply writes only if it is still the same
  expectedText: string | null
}

/**
 * Tells whether an operation (or a draft) is a category item label operation.
 * @param {object} op - Any change set operation.
 * @returns {boolean} True for categoryItemLabel.set.
 */
export const isCategoryItemLabelOperation = <T extends { type: string }>(
  op: T
): op is Extract<T, { type: typeof CATEGORY_ITEM_LABEL_SET }> => op.type === CATEGORY_ITEM_LABEL_SET

/**
 * Returns the key of a label (two operations with the same key write the same label).
 * @param {object} params - Parameters.
 * @param {string} params.itemUuid - Item uuid.
 * @param {string} params.lang - Language.
 * @returns {string} The key.
 */
export const getCategoryItemLabelKey = ({ itemUuid, lang }: { itemUuid: string; lang: string }): string =>
  `${itemUuid.toLowerCase()}|${lang}`
