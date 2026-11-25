/**
 * Category part of Apply: the selected category item label operations go to the server in requests of at most
 * CATEGORY_ITEM_LABELS_UPDATE_MAX (each one transaction, compare and set on the label each one was proposed over).
 * Their conflicts come from the answers.
 */
import {
  CATEGORY_ITEM_LABELS_UPDATE_MAX,
  type CategoryItemLabelsUpdateAnswer,
  type CategoryItemLabelUpdate,
} from '@common/ai/categoryItemLabels'
import * as Survey from '@core/survey/survey'
import { getRequestFailure } from '../requestFailure'
import type { ChangeSet, OperationResult, OperationStatus } from '../types'

import type { PutCategoryItemLabels } from './categoryItemLabelsApi'
import { type CategoryItemLabelSetOperation, getCategoryItemLabelKey } from './types'

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
 * Sends one chunk of operations and sets their results.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {CategoryItemLabelSetOperation[]} params.operations - Operations of the chunk.
 * @param {CategoryLabelsApplierDeps} params.deps - Server call.
 * @param {Map<string, OperationResult>} params.results - Results (updated).
 * @returns {Promise<CategoryItemLabelsUpdateAnswer|null>} The answer; null when the request failed.
 */
const applyChunk = async ({
  surveyId,
  operations,
  deps,
  results,
}: {
  surveyId: number
  operations: CategoryItemLabelSetOperation[]
  deps: CategoryLabelsApplierDeps
  results: Map<string, OperationResult>
}): Promise<CategoryItemLabelsUpdateAnswer | null> => {
  try {
    const answer = await deps.putCategoryItemLabels({ surveyId, items: operations.map(toUpdate) })
    setAnswerResults(answer, operations, results)
    return answer
  } catch (error) {
    const { message, params } = getRequestFailure(error)
    setAll(results, operations, 'failed', message, params)
    return null
  }
}

/**
 * Applies category item label operations, one server request per chunk; the store is updated once, at the end (a
 * reload per chunk would reload the survey under the next one).
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - Change set.
 * @param {CategoryItemLabelSetOperation[]} params.operations - Selected category operations without a result yet.
 * @param {Function} params.getSurvey - Returns the open survey.
 * @param {CategoryLabelsApplierDeps} [params.deps] - Server call and store updates (none: not supported here).
 * @param {Map<string, OperationResult>} params.results - Results (updated).
 * @param {number} [params.chunkSize] - Labels per request (the server limit).
 * @param {Function} [params.onChunkDone] - Labels of each request sent.
 * @returns {Promise<void>} Resolves when every operation has a result.
 */
export const applyCategoryItemLabels = async ({
  changeSet,
  operations,
  getSurvey,
  deps,
  results,
  chunkSize = CATEGORY_ITEM_LABELS_UPDATE_MAX,
  onChunkDone,
}: {
  changeSet: ChangeSet
  operations: CategoryItemLabelSetOperation[]
  getSurvey: () => any
  deps?: CategoryLabelsApplierDeps
  results: Map<string, OperationResult>
  chunkSize?: number
  onChunkDone?: (count: number) => void
}): Promise<void> => {
  if (operations.length === 0) return
  if (!deps) {
    setAll(results, operations, 'skipped', 'notSupported')
    return
  }
  // another survey was opened meanwhile (the store id may be a string: a bigint from the database)
  if (Number(Survey.getId(getSurvey())) !== Number(changeSet.surveyId)) {
    setAll(results, operations, 'skipped', 'surveyChanged')
    return
  }
  const categoriesByUuid = new Map<string, any>()
  let appliedCount = 0
  for (let start = 0; start < operations.length; start += chunkSize) {
    const chunk = operations.slice(start, start + chunkSize)
    // one request at a time: bounded server load and progress reported chunk by chunk
    const answer = await applyChunk({ surveyId: changeSet.surveyId, operations: chunk, deps, results }) // NOSONAR
    for (const category of answer?.categories ?? []) categoriesByUuid.set(category.uuid, category)
    appliedCount += answer?.applied.length ?? 0
    onChunkDone?.(chunk.length)
  }
  if (categoriesByUuid.size > 0) deps.onCategoriesUpdated([...categoriesByUuid.values()])
  if (appliedCount > 0) deps.onCategoryLabelsApplied()
}
