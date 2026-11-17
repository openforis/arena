/**
 * Shared parsers for raw model responses.
 *
 * Used by features that turned off `generateStructured` and now ask the
 * model for plain JSON (translation, data dictionary). The parsers are
 * intentionally tolerant — small open-weight models like to wrap output
 * in ``` fences or sandwich it between prose. The Zod schema in each
 * service still validates the shape after parsing, so type safety is
 * preserved.
 */

const FENCE = '```'
const FENCE_LANGUAGE_RE = /^[a-zA-Z]*/

/**
 * Strip a single wrapping triple-backtick code fence (with optional language tag), if any.
 * Plain string operations instead of a regex, to avoid super-linear backtracking on large model outputs.
 * @param {string} value - Raw text.
 * @returns {string} Trimmed text without the wrapping fence.
 */
export const stripFence = (value) => {
  const trimmed = value.trim()
  if (trimmed.length < FENCE.length * 2 || !trimmed.startsWith(FENCE) || !trimmed.endsWith(FENCE)) return trimmed
  const inner = trimmed.slice(FENCE.length, -FENCE.length)
  return inner.replace(FENCE_LANGUAGE_RE, '').trim()
}

/**
 * Pull a JSON object out of the model's raw text response. Tolerates a
 * surrounding triple-backtick code fence and trims any prose by clipping to the
 * outermost `{...}`.
 * @param {string} text - Raw model output.
 * @returns {object} Parsed JSON value.
 * @throws {Error} When no parsable JSON object is found.
 */
export const parseJsonResponse = (text) => {
  const candidate = stripFence(text || '')
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end < start) {
    throw new Error(`No JSON object found in model output: ${candidate.slice(0, 200)}`)
  }
  return JSON.parse(candidate.slice(start, end + 1))
}
