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

const FENCE_RE = /^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/

/**
 * Pull a JSON object out of the model's raw text response. Tolerates a
 * surrounding ``` code fence and trims any prose by clipping to the
 * outermost `{...}`.
 *
 * @param {string} text - Raw model output.
 * @returns {object} Parsed JSON value.
 * @throws {Error} When no parsable JSON object is found.
 * @param text
 * @param text
 * @param text
 * @param text
 * @param text
 * @param text
 * @param text
 * @param text
 * @param text
 * @param text
 */
export const parseJsonResponse = (text) => {
  const trimmed = (text || '').trim()
  const fenceMatch = trimmed.match(FENCE_RE)
  const candidate = (fenceMatch ? fenceMatch[1] : trimmed).trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end < start) {
    throw new Error(`No JSON object found in model output: ${candidate.slice(0, 200)}`)
  }
  return JSON.parse(candidate.slice(start, end + 1))
}
