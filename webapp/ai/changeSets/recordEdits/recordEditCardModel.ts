import { appModuleUri, dataModules } from '@webapp/app/appModules'

import type { ChangeSet, OperationResult } from '@webapp/ai/changeSets/types'

import { isRecordEditOperation, type RecordAttributeUpdateOperation } from './types'

export type RecordEditGroup = {
  recordUuid: string
  recordKeys: string
  recordNewErrors: number
  link: string
  operations: RecordAttributeUpdateOperation[]
}

/**
 * Returns the URL that opens the record editor at the page of the edited node.
 * @param {RecordAttributeUpdateOperation} operation - The edit.
 * @returns {string} The URL.
 */
export const getRecordEditLink = ({ recordUuid, page }: RecordAttributeUpdateOperation): string =>
  `${appModuleUri(dataModules.record)}${recordUuid}?pageNodeUuid=${page.nodeUuid}&pageNodeDefUuid=${page.nodeDefUuid}`

/**
 * Groups the edits by record, in order of first appearance.
 * @param {RecordAttributeUpdateOperation[]} operations - The edits.
 * @returns {RecordEditGroup[]} The groups.
 */
export const groupOperationsByRecord = (operations: RecordAttributeUpdateOperation[]): RecordEditGroup[] => {
  const groups = new Map<string, RecordEditGroup>()
  for (const operation of operations) {
    const group = groups.get(operation.recordUuid) ?? {
      recordUuid: operation.recordUuid,
      recordKeys: operation.recordKeys,
      recordNewErrors: operation.preview.recordNewErrors,
      link: getRecordEditLink(operation),
      operations: [],
    }
    group.operations.push(operation)
    groups.set(operation.recordUuid, group)
  }
  return [...groups.values()]
}

/**
 * Returns the edits that can still be applied: no result yet, or failed.
 * @param {RecordAttributeUpdateOperation[]} operations - The edits.
 * @param {OperationResult[]} [results] - Results so far.
 * @returns {string[]} Their ids.
 */
export const getSelectableOperationIds = (
  operations: RecordAttributeUpdateOperation[],
  results: OperationResult[] = []
): string[] => {
  const statusById = new Map(results.map((result) => [result.id, result.status]))
  return operations
    .filter((operation) => {
      const status = statusById.get(operation.id)
      return status === undefined || status === 'failed'
    })
    .map((operation) => operation.id)
}

// D1's merge (an operation keeps its latest result, new ones appended): one rule for both cards
export { mergeOperationResults } from '@webapp/components/ai/Assistant/assistantPanelModel'

// failures that may succeed when sent again; the others (duplicate key, node not in the record, not editable...) are
// deterministic, so resending them would only fail again
const transientFailureKeys = new Set([
  'appErrors:record.lockTimeout',
  'appErrors:aiApplyTimeout',
  'appErrors:networkError',
  'appErrors:generic',
])

/**
 * Returns the ids of the edits that failed for a transient reason (Retry).
 * @param {OperationResult[]} results - Results.
 * @returns {string[]} The ids.
 */
export const getRetryOperationIds = (results: OperationResult[] = []): string[] =>
  results
    .filter(({ status, message }) => status === 'failed' && message !== undefined && transientFailureKeys.has(message))
    .map((result) => result.id)

/**
 * Counts the results by status.
 * @param {OperationResult[]} results - Results.
 * @returns {{applied: number, conflict: number, failed: number}} The counts.
 */
export const countOperationResults = (results: OperationResult[] = []) => {
  const counts = { applied: 0, conflict: 0, failed: 0 }
  for (const { status } of results) {
    if (status in counts) counts[status as keyof typeof counts] += 1
  }
  return counts
}

/**
 * Describes the results of an Apply for the model (the user sees the card).
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - The change set.
 * @param {OperationResult[]} params.results - Results.
 * @returns {string} E.g. "Applied 1 of 3 edits. 12, plot[1] / dbh: conflict (…)."
 */
export const summarizeRecordEditResults = ({
  changeSet,
  results,
}: {
  changeSet: ChangeSet
  results: OperationResult[]
}) => {
  const operationById = new Map(
    changeSet.operations.filter(isRecordEditOperation).map((operation) => [operation.id, operation])
  )
  const { applied } = countOperationResults(results)
  const parts = [`Applied ${applied} of ${results.length} edits.`]
  for (const result of results) {
    const operation = operationById.get(result.id)
    if (!operation || result.status === 'applied') continue
    const outcome =
      result.status === 'conflict'
        ? 'conflict (the value changed since the proposal, not written)'
        : `failed (${result.message})`
    parts.push(`${operation.recordKeys}, ${operation.path}: ${outcome}.`)
  }
  return parts.join(' ')
}
