/**
 * Card model of category item label operations: one group per category, in proposal order.
 */
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import {
  isCategoryItemLabelOperation,
  type CategoryItemLabelSetOperation,
} from '@webapp/ai/changeSets/categoryItemLabels/types'
import type { TranslationSource } from '@webapp/ai/changeSets/translationSource'
import type { ChangeSetCardState, OperationResult } from '@webapp/ai/changeSets/types'

export type CategoryLabelRow = {
  id: string
  ref: string
  levelName: string
  lang: string
  // the label when the item was listed (null: blank)
  from: string | null
  to: string
  // the label in another language the text translates
  source: TranslationSource | null
  result: OperationResult | null
  // the label found at Apply when it had changed meanwhile (conflict)
  currentText: string | null
}

export type CategoryLabelGroup = { categoryUuid: string; categoryName: string; rows: CategoryLabelRow[] }

/**
 * Returns the name of a category, or its uuid when it was deleted.
 * @param {object} survey - Survey.
 * @param {string} categoryUuid - Category uuid.
 * @returns {string} The name.
 */
const getCategoryName = (survey: any, categoryUuid: string): string => {
  const category = Survey.getCategoryByUuid(categoryUuid)(survey)
  return category ? Category.getName(category) : categoryUuid
}

/**
 * Converts an operation to a row.
 * @param {CategoryItemLabelSetOperation} op - Operation.
 * @param {OperationResult|null} result - Its result, after Apply.
 * @returns {CategoryLabelRow} The row.
 */
const toRow = (op: CategoryItemLabelSetOperation, result: OperationResult | null): CategoryLabelRow => {
  const currentText = result?.status === 'conflict' ? ((result.params?.currentText as string | null) ?? null) : null
  return {
    id: op.id,
    ref: op.ref,
    levelName: op.levelName,
    lang: op.lang,
    from: op.expectedText?.trim() ? op.expectedText : null,
    to: op.text,
    source: op.source ?? null,
    result,
    currentText,
  }
}

/**
 * Groups the category label operations of a card by category.
 * @param {object} params - Parameters.
 * @param {ChangeSetCardState} params.cardState - Card state.
 * @param {object} params.survey - Current survey (category names).
 * @returns {CategoryLabelGroup[]} The groups, in order of first appearance.
 */
export const buildCategoryLabelGroups = ({
  cardState,
  survey,
}: {
  cardState: ChangeSetCardState
  survey: any
}): CategoryLabelGroup[] => {
  const { changeSet, results = [] } = cardState
  const groups = new Map<string, CategoryLabelGroup>()
  for (const op of changeSet.operations) {
    if (!isCategoryItemLabelOperation(op)) continue
    const group = groups.get(op.categoryUuid) ?? {
      categoryUuid: op.categoryUuid,
      categoryName: getCategoryName(survey, op.categoryUuid),
      rows: [],
    }
    group.rows.push(toRow(op, results.find((item) => item.id === op.id) ?? null))
    groups.set(op.categoryUuid, group)
  }
  return [...groups.values()]
}
