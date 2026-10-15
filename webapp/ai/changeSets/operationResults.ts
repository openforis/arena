import type { OperationResult } from './types'

/**
 * Merges the results of a new Apply into the previous ones (an operation keeps its latest result): one rule for the
 * change set card and the record edit card.
 * @param {OperationResult[]} [previous] - Earlier results.
 * @param {OperationResult[]} next - New results.
 * @returns {OperationResult[]} The merged results.
 */
export const mergeOperationResults = (previous: OperationResult[] = [], next: OperationResult[]): OperationResult[] => {
  const byId = new Map(previous.map((result) => [result.id, result]))
  for (const result of next) byId.set(result.id, result)
  return [...byId.values()]
}
