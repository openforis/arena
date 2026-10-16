/**
 * What every row of a change set shares, whatever it shows it in (pure): the kind of item, and the items of a card
 * split into node definition changes and category label groups.
 */
import { isI18nKeyReason, type OperationResult } from '@webapp/ai/changeSets/types'

import type { CardDetail } from './changeSetCardModel'
import type { ReviewItem } from './changeSetReviewModel'

type TFunction = (key: string, params?: Record<string, unknown>) => string

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
 * Returns the extra lines of a new node definition (key, multiple, read only, other labels, descriptions), each with
 * its translated title.
 * @param {ReviewItem} item - Item.
 * @param {TFunction} t - Translation function.
 * @returns {{key: string, title: string, value: CardDetail['value']}[]} The lines; empty for other changes.
 */
export const getItemDetailLines = (
  item: ReviewItem,
  t: TFunction
): { key: string; title: string; value: CardDetail['value'] }[] =>
  (item.details ?? []).map((detail, index) => ({
    key: `${index}-${detail.titleKey}-${detail.titleParams.lang ?? ''}`,
    title: t(detail.titleKey, detail.titleParams),
    value: detail.value,
  }))

// the plain reasons of a conflict, a skipped or a failed operation that have a sentence (aiAssistant.card.reason.*)
const PLAIN_REASONS: ReadonlySet<string> = new Set([
  'nodeDefMissing',
  'valueChanged',
  'parentMissing',
  'nameTaken',
  'alreadyExists',
  'refMissing',
  'itemMissing',
  'surveyDirty',
  'surveyChanged',
  'dependencyNotApplied',
  'notSupported',
  'missingResult',
])

const ISSUES_SEPARATOR = '; '

/**
 * Returns the sentence of one reason, without the issues behind it.
 * @param {TFunction} t - Translation function.
 * @param {string} reason - Conflict reason, or message of a result.
 * @param {Record<string, unknown>} [params] - Interpolation values of an i18n key reason.
 * @returns {string} The text.
 */
const getReasonSentence = (t: TFunction, reason: string, params?: Record<string, unknown>): string => {
  if (isI18nKeyReason(reason)) return t(reason, params)
  return PLAIN_REASONS.has(reason) ? t(`aiAssistant.card.reason.${reason}`) : reason
}

/**
 * Returns the translated issues listed in the params of a reason (the node definition that would be invalid: each
 * issue has an i18n key and its own params).
 * @param {TFunction} t - Translation function.
 * @param {Record<string, unknown>} [params] - Params of the reason.
 * @returns {string} The issues, joined (blank when there is none).
 */
const getIssuesText = (t: TFunction, params?: Record<string, unknown>): string => {
  const issues = params?.issues
  if (!Array.isArray(issues)) return ''
  const texts: string[] = []
  for (const issue of issues) {
    if (typeof issue?.key === 'string') texts.push(getReasonSentence(t, issue.key, issue.params))
  }
  return texts.join(ISSUES_SEPARATOR)
}

/**
 * Returns the sentence of a reason: an i18n key (the designer's rules or the server refused the change) is translated
 * with its params, the issues behind it listed after it; a plain reason (nodeDefMissing, valueChanged...) has its
 * `aiAssistant.card.reason.*` sentence; any other text (a message of the server) is returned as it is.
 * @param {TFunction} t - Translation function.
 * @param {string} reason - Conflict reason, or message of a result.
 * @param {Record<string, unknown>} [params] - Interpolation values of an i18n key reason.
 * @returns {string} The text.
 */
export const getConflictReasonText = (t: TFunction, reason: string, params?: Record<string, unknown>): string => {
  const sentence = getReasonSentence(t, reason, params)
  const issuesText = isI18nKeyReason(reason) ? getIssuesText(t, params) : ''
  return issuesText ? `${sentence} ${issuesText}` : sentence
}

/**
 * Returns the tooltip of a result: the sentence of its message (see getConflictReasonText), and the text found when a
 * label had changed since the proposal.
 * @param {OperationResult|null} result - Result of an Apply.
 * @param {TFunction} t - Translation function.
 * @returns {string|undefined} The title.
 */
export const getResultTitle = (result: OperationResult | null, t: TFunction): string | undefined => {
  if (!result) return undefined
  const currentText = result.status === 'conflict' ? result.params?.currentText : null
  const message = result.message ? getConflictReasonText(t, result.message, result.params) : null
  const parts = [message, typeof currentText === 'string' ? currentText : null]
  return parts.filter(Boolean).join(': ') || undefined
}
