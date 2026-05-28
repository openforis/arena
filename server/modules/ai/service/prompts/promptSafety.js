/**
 * Helpers for safely embedding untrusted strings into LLM prompts.
 *
 * Concatenating user-controlled text into a prompt with no delimitation
 * gives the user the ability to break out of any "fence" the prompt
 * author wrote (`"""..."""`, `<tag>...</tag>`, etc.) and append their
 * own instructions. `pq` ("prompt-quote") truncates and JSON-stringifies
 * the value so the model sees a single quoted string token; backslashes,
 * quotes, newlines, and control chars are escaped by `JSON.stringify`.
 *
 * The length cap also bounds prompt size — a 10 MB description against a
 * paid provider key would otherwise be a cost-amplification primitive.
 */
export const PROMPT_FIELD_MAX = 4000

export const pq = (value, maxLen = PROMPT_FIELD_MAX) => {
  if (value == null) return '""'
  const s = String(value)
  const truncated = s.length > maxLen ? `${s.slice(0, maxLen)}…[truncated]` : s
  return JSON.stringify(truncated)
}
