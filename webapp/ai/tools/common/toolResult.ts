/**
 * What a tool returns to the model: the one size budget, the one error result and the helpers that keep a result
 * within the budget without cutting it in the middle of a value.
 */
import { AiLimits } from '@common/ai/limits'

import type { AiToolErrorResult } from '../types'

// the most the wrapper lets through; a longer result is cut by `limitToolResult`
export const TOOL_RESULT_MAX_CHARS = AiLimits.assistantToolResultMaxChars

// what a tool fills by itself: the rest is room for the fields added around its result (truncated, shownToUser...)
export const TOOL_RESULT_BUDGET_CHARS = TOOL_RESULT_MAX_CHARS - 500

const DETAILS_DROPPED_MESSAGE_MAX_CHARS = 1000

// each step removes a fifth of the largest list or string
const SHRINK_FACTOR = 0.8

const sizeOf = (value: unknown): number => JSON.stringify(value).length

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * Builds the structured error result the model can read and recover from. It is the only builder: a tool throws an
 * AiToolFailure and the registry calls this. When the result exceeds the limit the details are dropped.
 * @param {string} code - Error code.
 * @param {string} message - Message for the model (English).
 * @param {object} [details] - Extra fields.
 * @returns {AiToolErrorResult} The error result, always within the limit.
 */
export const toolError = (code: string, message: string, details: Record<string, unknown> = {}): AiToolErrorResult => {
  const result = { error: { code, message, ...details } }
  if (sizeOf(result) <= TOOL_RESULT_MAX_CHARS) return result
  return { error: { code, message: message.slice(0, DETAILS_DROPPED_MESSAGE_MAX_CHARS), detailsDropped: true } }
}

/**
 * Removes a fifth of the largest list or string of a value (a key that is empty or cannot be cut is dropped).
 * @param {unknown} value - The value.
 * @returns {unknown} A smaller copy, or the same value when there is nothing left to cut.
 */
const shrinkOnce = (value: unknown): unknown => {
  if (Array.isArray(value) || typeof value === 'string') {
    return value.length > 0 ? value.slice(0, Math.floor(value.length * SHRINK_FACTOR)) : value
  }
  if (!isPlainObject(value)) return value
  const keys = Object.keys(value).filter((key) => key !== 'truncated')
  if (keys.length === 0) return value
  const largestKey = keys.reduce((largest, key) => (sizeOf(value[key]) > sizeOf(value[largest]) ? key : largest))
  const shrunk = shrinkOnce(value[largestKey])
  if (shrunk !== value[largestKey]) return { ...value, [largestKey]: shrunk }
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== largestKey))
}

/**
 * Shrinks a value until its JSON fits.
 * @param {unknown} value - The value.
 * @param {number} maxChars - Maximum JSON length.
 * @returns {unknown} The value that fits.
 */
const shrinkToFit = (value: unknown, maxChars: number): unknown => {
  let current = value
  while (sizeOf(current) > maxChars) {
    const next = shrinkOnce(current)
    if (Object.is(next, current)) return { truncated: true }
    current = next
  }
  return current
}

/**
 * Wraps a value that is not an object, so `truncated: true` can be added to it.
 * @param {unknown} value - The value.
 * @returns {object} The value with `truncated: true`.
 */
const toTruncatedObject = (value: unknown): Record<string, unknown> => {
  if (isPlainObject(value)) return { ...value, truncated: true }
  if (Array.isArray(value)) return { truncated: true, items: value }
  return { truncated: true, text: value }
}

/**
 * Limits the JSON size of a tool result. A longer result loses the end of its largest list (or string) and gets
 * `truncated: true`, so the model always reads valid values, never half of one.
 * @param {unknown} output - Tool output.
 * @param {number} [maxChars] - Maximum JSON length.
 * @returns {unknown} The output (undefined becomes null), or the cut copy.
 */
export const limitToolResult = (output: unknown, maxChars: number = TOOL_RESULT_MAX_CHARS): unknown => {
  const value = output === undefined ? null : output
  if (sizeOf(value) <= maxChars) return value
  return shrinkToFit(toTruncatedObject(value), maxChars)
}

/**
 * Returns the leading entries whose JSON still fits the budget, for a tool that builds a list one entry at a time
 * (entries after the first that does not fit are not built).
 * @param {S[]} items - Items, in order.
 * @param {object} [params] - Parameters.
 * @param {number} [params.baseChars] - JSON length of the result without the entries.
 * @param {number} [params.maxChars] - Maximum JSON length of the result (default: the budget).
 * @param {Function} [params.toEntry] - Builds the entry of an item (default: the item).
 * @returns {T[]} The entries that fit.
 */
export const takeWithinBudget = <S, T = S>(
  items: S[],
  {
    baseChars = 0,
    maxChars = TOOL_RESULT_BUDGET_CHARS,
    toEntry = (item: S) => item as unknown as T,
  }: { baseChars?: number; maxChars?: number; toEntry?: (item: S) => T } = {}
): T[] => {
  const taken: T[] = []
  let size = baseChars
  for (const item of items) {
    const entry = toEntry(item)
    size += sizeOf(entry) + 1
    if (size > maxChars) break
    taken.push(entry)
  }
  return taken
}

/**
 * Removes items from the end of a list until the JSON of the result fits the budget.
 * @param {object} result - Tool result.
 * @param {string} key - Key of the list in the result.
 * @param {number} [maxChars] - Maximum JSON length.
 * @returns {object} The result (the same object when it already fits), with truncated: true when cut.
 */
export const fitListToBudget = <T extends Record<string, unknown>>(
  result: T,
  key: keyof T & string,
  maxChars: number = TOOL_RESULT_BUDGET_CHARS
): T & { truncated?: boolean } => {
  const items = result[key] as unknown[]
  let fitted: T & { truncated?: boolean } = result
  let count = items.length
  while (count > 0 && sizeOf(fitted) > maxChars) {
    count = Math.floor(count * SHRINK_FACTOR)
    fitted = { ...result, [key]: items.slice(0, count), truncated: true } as T & { truncated?: boolean }
  }
  return fitted
}
