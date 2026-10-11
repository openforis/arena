/**
 * Category part of Apply: the selected category item label operations go to the server in one request (one
 * transaction, compare and set on the label each one was proposed over). Their conflicts come from the answer.
 */
import * as Survey from '@core/survey/survey'

import type { CategoryItemLabelsUpdateAnswer, CategoryItemLabelUpdate } from '@common/ai/categoryItemLabels'

import type { ChangeSet, OperationResult, OperationStatus } from '../types'
import type { PutCategoryItemLabels } from './categoryItemLabelsApi'
import { getCategoryItemLabelKey, type CategoryItemLabelSetOperation } from './types'

export type CategoryLabelsApplierDeps = {
  putCategoryItemLabels: PutCategoryItemLabels
  // the categories of the written items, as the server returns them
  onCategoriesUpdated: (categories: any[]) => void
  // at least one label was written
  onCategoryLabelsApplied: () => void
}

/**
 * Sets the same result on every operation.
 * @param {Map<string, OperationResult>} results - Results (updated).
 * @param {CategoryItemLabelSetOperation[]} operations - Operations.
 * @param {OperationStatus} status - Status.
 * @param {string} message - Message.
 * @param {object} [params] - Message params.
 * @returns {void}
 */
const setAll = (
  results: Map<string, OperationResult>,
  operations: CategoryItemLabelSetOperation[],
  status: OperationStatus,
  message: string,
  params?: Record<string, unknown>
): void => {
  for (const { id } of operations) results.set(id, { id, status, message, ...(params ? { params } : {}) })
}

/**
 * Converts an operation to its server update.
 * @param {CategoryItemLabelSetOperation} op - Operation.
 * @returns {CategoryItemLabelUpdate} The update.
 */
const toUpdate = ({ itemUuid, lang, text, expectedText }: CategoryItemLabelSetOperation): CategoryItemLabelUpdate => ({
  itemUuid,
  lang,
  text,
  expectedText,
})

/**
 * Returns the message of a failed request: the server's message key and params, or the error message.
 * @param {unknown} error - The request error.
 * @returns {{message: string, params?: object}} The message.
 */
const getRequestError = (error: any): { message: string; params?: Record<string, unknown> } => {
  const data = error?.response?.data
  if (data?.key) return { message: data.key, params: data.params ?? {} }
  return { message: error instanceof Error ? error.message : String(error) }
}

/**
 * Sets the results of the answer: written labels, conflicts, and failed for those it does not mention.
 * @param {CategoryItemLabelsUpdateAnswer} answer - Server answer.
 * @param {CategoryItemLabelSetOperation[]} operations - Operations sent.
 * @param {Map<string, OperationResult>} results - Results (updated).
 * @returns {void}
 */
const setAnswerResults = (
  answer: CategoryItemLabelsUpdateAnswer,
  operations: CategoryItemLabelSetOperation[],
  results: Map<string, OperationResult>
): void => {
  const operationsByKey = new Map(operations.map((op) => [getCategoryItemLabelKey(op), op]))
  for (const label of answer.applied) {
    const op = operationsByKey.get(getCategoryItemLabelKey(label))
    if (op) results.set(op.id, { id: op.id, status: 'applied' })
  }
  for (const conflict of answer.conflicts) {
    const op = operationsByKey.get(getCategoryItemLabelKey(conflict))
    if (!op) continue
    results.set(op.id, {
      id: op.id,
      status: 'conflict',
      message: conflict.reason,
      params: { currentText: conflict.currentText },
    })
  }
  for (const { id } of operations) {
    if (!results.has(id)) results.set(id, { id, status: 'failed', message: 'missingResult' })
  }
}

/**
 * Applies category item label operations with one server request.
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - Change set.
 * @param {CategoryItemLabelSetOperation[]} params.operations - Selected category operations without a result yet.
 * @param {Function} params.getSurvey - Returns the open survey.
 * @param {CategoryLabelsApplierDeps} [params.deps] - Server call and store updates (none: not supported here).
 * @param {Map<string, OperationResult>} params.results - Results (updated).
 * @returns {Promise<void>} Resolves when every operation has a result.
 */
export const applyCategoryItemLabels = async ({
  changeSet,
  operations,
  getSurvey,
  deps,
  results,
}: {
  changeSet: ChangeSet
  operations: CategoryItemLabelSetOperation[]
  getSurvey: () => any
  deps?: CategoryLabelsApplierDeps
  results: Map<string, OperationResult>
}): Promise<void> => {
  if (operations.length === 0) return
  if (!deps) {
    setAll(results, operations, 'skipped', 'notSupported')
    return
  }
  // another survey was opened meanwhile
  if (Survey.getId(getSurvey()) !== changeSet.surveyId) {
    setAll(results, operations, 'skipped', 'surveyChanged')
    return
  }
  let answer: CategoryItemLabelsUpdateAnswer
  try {
    answer = await deps.putCategoryItemLabels({ surveyId: changeSet.surveyId, items: operations.map(toUpdate) })
  } catch (error) {
    const { message, params } = getRequestError(error)
    setAll(results, operations, 'failed', message, params)
    return
  }
  setAnswerResults(answer, operations, results)
  if (answer.categories.length > 0) deps.onCategoriesUpdated(answer.categories)
  if (answer.applied.length > 0) deps.onCategoryLabelsApplied()
}
