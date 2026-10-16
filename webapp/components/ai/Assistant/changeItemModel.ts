/**
 * What every row of a change set shares, whatever it shows it in (pure): the kind of item, and the items of a card
 * split into node definition changes and category label groups.
 */
import { isI18nKeyReason, type OperationResult } from '@webapp/ai/changeSets/types'

import type { CardDetail, CardValue } from './changeSetCardModel'
import type { ReviewItem } from './changeSetReviewModel'

type TFunction = (key: string, params?: Record<string, unknown>) => string

const CATEGORY_GROUP_PREFIX = 'category:'

// the short kind of a label change, shown next to the item name (its language is shown apart)
const LABEL_KIND_KEYS: Record<string, string> = {
  'aiAssistant.card.label': 'aiAssistant.card.kind.label',
  'aiAssistant.card.description': 'aiAssistant.card.kind.description',
}

// a null language: it differs between rows, each row shows its own
export type ReviewColumns = {
  original: { lang: string | null } | null
  current: boolean
  proposedLang: string | null
}

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
 * Tells whether a value has something to show (false for a blank text or an empty expression list).
 * @param {CardValue|null} value - Value.
 * @returns {boolean} True when not blank.
 */
export const hasCardValue = (value: CardValue | null): boolean => {
  if (value === null) return false
  if (value.kind === 'text') return (value.text ?? '').trim() !== ''
  if (value.kind === 'expressions') return value.items.length > 0
  return true
}

/**
 * Returns what a node definition change is about, without its language: "Label", "Description", or the title of
 * any other change ("Read only", "New text"...).
 * @param {ReviewItem} item - Node definition change.
 * @returns {{key: string, params: Record<string, string>}} The i18n key and its params.
 */
export const getItemKind = (item: ReviewItem): { key: string; params: Record<string, string> } => {
  const kindKey = LABEL_KIND_KEYS[item.field.key]
  return kindKey ? { key: kindKey, params: {} } : item.field
}

/**
 * Tells whether a change is about the same item as the change before it (the review table shows the item once).
 * @param {ReviewItem[]} items - Changes shown, in order.
 * @param {number} index - Index of the change.
 * @returns {boolean} True when the previous change has the same node definition, or the same category item.
 */
export const isSameItemAsPrevious = (items: ReviewItem[], index: number): boolean => {
  const previous = items[index - 1]
  const item = items[index]
  if (!previous || !item) return false
  if (item.nodeDefUuid !== null) return previous.nodeDefUuid === item.nodeDefUuid
  return previous.nodeDefUuid === null && previous.groupKey === item.groupKey && previous.name === item.name
}

/**
 * Returns the language every value of a list shares.
 * @param {string[]} langs - Languages.
 * @returns {string|null} The language; null when they differ or the list is empty.
 */
const getCommonLang = (langs: string[]): string | null =>
  langs.length > 0 && langs.every((lang) => lang === langs[0]) ? langs[0] : null

/**
 * Returns the columns of the review table: Original when a change is a translation (with its language when every
 * translation shares it), Current when a change that is not a translation has a current value (a translation shows
 * the text it overwrites under its proposal), and the language of Proposed when every change is a translation into it.
 * @param {ReviewItem[]} items - Every change of the card (the columns stay when filtering).
 * @returns {ReviewColumns} The columns.
 */
export const getReviewColumns = (items: ReviewItem[]): ReviewColumns => {
  const translations = items.filter((item) => item.source)
  return {
    original:
      translations.length > 0 ? { lang: getCommonLang(translations.map((item) => item.source?.lang ?? '')) } : null,
    current: items.some((item) => !item.source && hasCardValue(item.from)),
    proposedLang: translations.length === items.length ? getCommonLang(items.map(getItemLang)) : null,
  }
}

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
