/**
 * Maps any error of a model call to a SystemError with a stable key and HTTP status. The browser only ever
 * sees the key (+ params); the upstream message and body go to the server log (formatErrorForLog).
 */
import { APICallError } from '@ai-sdk/provider'

import SystemError, { StatusCodes } from '@core/systemError'
import type { AiWireError } from '@common/ai/wire'

const TOO_MANY_REQUESTS = 429

const PROVIDER_REJECTED_STATUSES = new Set([400, 404, 413, 422])

const aiError = (key: string, statusCode: number) => new SystemError(key, {}, statusCode)

// the AI SDK wraps the attempts of a retried call in a RetryError ({ errors, lastError })
const unwrapRetry = (error: any): any => (Array.isArray(error?.errors) && error?.lastError ? error.lastError : error)

const fromUpstreamStatus = (statusCode: number | undefined): SystemError => {
  if (statusCode === 401 || statusCode === 403) return aiError('aiProviderAuth', StatusCodes.BAD_GATEWAY)
  if (statusCode === TOO_MANY_REQUESTS) return aiError('aiProviderRateLimited', TOO_MANY_REQUESTS)
  if (PROVIDER_REJECTED_STATUSES.has(statusCode)) return aiError('aiProviderRejected', StatusCodes.BAD_GATEWAY)
  return aiError('aiProviderUnavailable', StatusCodes.BAD_GATEWAY)
}

/**
 * Converts an error of a model call into a SystemError.
 * @param {unknown} error - The error.
 * @param {object} [options] - Options.
 * @param {boolean} [options.timedOut] - True when the gateway timeout aborted the call.
 * @returns {SystemError} The error to send (as is for SystemErrors).
 */
export const toAiSystemError = (error: unknown, { timedOut = false }: { timedOut?: boolean } = {}): SystemError => {
  if (timedOut) return aiError('aiRequestTimeout', StatusCodes.GATEWAY_TIMEOUT)
  if (error instanceof SystemError) return error
  const unwrapped = unwrapRetry(error)
  if (unwrapped instanceof SystemError) return unwrapped
  if (APICallError.isInstance(unwrapped)) return fromUpstreamStatus(unwrapped.statusCode)
  return aiError('aiProviderUnavailable', StatusCodes.BAD_GATEWAY)
}

/**
 * Converts an error into the form sent to the browser.
 * @param {unknown} error - The error.
 * @returns {AiWireError} Key and params only.
 */
export const toAiWireError = (error: unknown): AiWireError => {
  const systemError = toAiSystemError(error)
  return { key: systemError.key, params: systemError.params ?? {} }
}

/**
 * Builds a detailed log message (class, message, upstream status/body/url, cause, stack).
 * @param {string} feature - Feature key, for context.
 * @param {unknown} error - The error.
 * @returns {string} Multi-line log text.
 */
export const formatErrorForLog = (feature: string, error: unknown): string => {
  const err: any = unwrapRetry(error)
  const lines = [`${feature} model call failed: ${err?.constructor?.name || 'Error'}: ${err?.message || err}`]
  if (err?.responseBody) lines.push(`  responseBody: ${String(err.responseBody).slice(0, 2000)}`)
  if (err?.statusCode) lines.push(`  statusCode: ${err.statusCode}`)
  if (err?.url) lines.push(`  url: ${err.url}`)
  if (err?.cause) lines.push(`  cause: ${err.cause?.constructor?.name || ''} ${err.cause?.message || err.cause}`)
  if (err?.stack) lines.push(err.stack)
  return lines.join('\n')
}
