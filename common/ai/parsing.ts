/**
 * Tolerant parsers for raw model output (small local models wrap answers in code fences or prose)
 * and the one-retry-with-feedback loop shared by every feature.
 */
import type { z } from 'zod'

const FENCE_RE = /^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/

const escapeRegExp = (value: string): string => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)

/**
 * Removes a single code fence wrapping the whole text.
 * @param {string} text - Raw text.
 * @returns {string} The trimmed text without the fence.
 */
export const stripCodeFences = (text: string): string => {
  const trimmed = (text ?? '').trim()
  const match = FENCE_RE.exec(trimmed)
  return (match ? match[1] : trimmed).trim()
}

/**
 * Returns the content of the first `<tag>…</tag>` element (case-insensitive).
 * @param {string} text - Raw text.
 * @param {string} tag - Tag name.
 * @returns {string|null} The trimmed content, or null when the tag is missing.
 */
export const extractTaggedValue = (text: string, tag: string): string | null => {
  const name = escapeRegExp(tag)
  const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'i').exec(text ?? '')
  return match ? match[1].trim() : null
}

/**
 * Extracts and parses the outermost JSON object of a model answer.
 * @param {string} text - Raw model output.
 * @returns {unknown} The parsed JSON value.
 * @throws {Error} When no parsable JSON object is found.
 */
export const parseJsonResponse = (text: string): unknown => {
  const candidate = stripCodeFences(text)
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end < start) {
    throw new Error(`No JSON object found in model output: ${candidate.slice(0, 200)}`)
  }
  return JSON.parse(candidate.slice(start, end + 1))
}

/**
 * Parses a model answer and validates it with the given schema, without throwing.
 * @param {string} text - Raw model output.
 * @param {z.ZodType} schema - Expected shape.
 * @returns {{value: object|null, error: string|null}} The value, or the error to feed back to the model.
 */
export const safeParseJsonResponse = <T>(
  text: string,
  schema: z.ZodType<T>
): { value: T | null; error: string | null } => {
  let json: unknown
  try {
    json = parseJsonResponse(text)
  } catch (error) {
    return { value: null, error: error?.message ?? String(error) }
  }
  const result = schema.safeParse(json)
  if (result.success) return { value: result.data, error: null }
  return { value: null, error: `invalid JSON answer: ${result.error.message}` }
}

export type RetryFeedback = {
  message: string
  // the previous (rejected) expression, fed back by the expression feature
  expression?: string
}

/**
 * Runs a model call and, when its result is rejected, runs it once more with feedback about what was wrong.
 * Errors thrown by `run` (transport, auth, limits) are not retried.
 * @param {object} params - Parameters.
 * @param {Function} params.run - The call: receives null the first time, then the feedback.
 * @param {Function} params.getRetryFeedback - Returns the feedback for a rejected result, or null to accept it.
 * @param {Function} [params.onRetry] - Called with the feedback before the retry (e.g. to log it).
 * @returns {Promise<object>} The accepted first result, or the second result (accepted or not).
 */
export const withOneRetry = async <T>({
  run,
  getRetryFeedback,
  onRetry,
}: {
  run: (feedback: RetryFeedback | null) => Promise<T>
  getRetryFeedback: (result: T) => RetryFeedback | null
  onRetry?: (feedback: RetryFeedback) => void
}): Promise<T> => {
  const first = await run(null)
  const feedback = getRetryFeedback(first)
  if (!feedback) return first
  onRetry?.(feedback)
  return run(feedback)
}
