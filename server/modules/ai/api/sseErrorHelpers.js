/**
 * Shared formatters for SSE-route error reporting.
 *
 * Both AI streaming routes (expression explainer, activity-log
 * summarizer) catch errors inside their stream-consumer try/catch and
 * need to (a) log enough to debug a model-server failure and (b) surface
 * a useful payload to the browser without leaking internals.
 */

/**
 * Build a verbose log message for a stream-side failure. Includes the
 * error class, message, cause, stack, and (for AI SDK APICallError) the
 * raw upstream response body — the latter is the single most useful
 * field when a local OpenAI-compatible server rejects a request.
 * @param {string} feature - Feature key for log context.
 * @param {Error} error - The thrown error.
 * @returns {string} Multi-line log string.
 */
export const formatStreamErrorForLog = (feature, error) => {
  const lines = [`${feature} stream failed: ${error?.constructor?.name || 'Error'}: ${error?.message || error}`]
  if (error?.responseBody) lines.push(`  responseBody: ${String(error.responseBody).slice(0, 2000)}`)
  if (error?.statusCode) lines.push(`  statusCode: ${error.statusCode}`)
  if (error?.url) lines.push(`  url: ${error.url}`)
  if (error?.cause) {
    const cause = error.cause
    lines.push(`  cause: ${cause?.constructor?.name || ''} ${cause?.message || cause}`)
  }
  if (error?.stack) lines.push(error.stack)
  return lines.join('\n')
}

/**
 * Build the wire-side payload for an SSE error event. Returns enough to
 * diagnose without leaking internals: error class + first line of
 * message, or the SystemError key if available.
 * @param {Error} error - The thrown error.
 * @returns {string} The error string for the SSE payload.
 */
export const formatStreamErrorForWire = (error) => {
  if (error?.key) return error.key
  const className = error?.constructor?.name || 'Error'
  const firstLine = (error?.message || '').split('\n')[0].trim()
  return firstLine ? `${className}: ${firstLine}` : className
}
