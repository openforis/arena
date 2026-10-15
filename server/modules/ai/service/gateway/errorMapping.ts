/**
 * Maps any error of a model call to a SystemError with a stable key and HTTP status. The browser only ever
 * sees the key (+ params); the upstream message and body go to the server log (formatErrorForLog).
 */
import { APICallError } from '@ai-sdk/provider'

import SystemError, { StatusCodes } from '@core/systemError'
import type { AiWireError } from '@common/ai/wire'

const TOO_MANY_REQUESTS = 429

// a provider can echo parts of the request in its error (body, message): only the start of each is logged
const LOGGED_TEXT_CHARS = 300

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
  // the AI SDK wraps what fails while it reads an answer (e.g. one over the size cap) in an APICallError
  if (unwrapped?.cause instanceof SystemError) return unwrapped.cause
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

const clip = (value: unknown): string => String(value).slice(0, LOGGED_TEXT_CHARS)

// the frames of a stack, without its first lines, which repeat the message of the error
const stackFrames = (stack: unknown): string[] =>
  String(stack)
    .split('\n')
    .filter((line) => /^\s+at /.test(line))
    .map(clip)

/**
 * Builds a detailed log message (class, message, upstream status/body/url, cause, stack frames). Every text that
 * can come from the provider is cut to a few hundred characters.
 * @param {string} feature - Feature key, for context.
 * @param {unknown} error - The error.
 * @returns {string} Multi-line log text.
 */
export const formatErrorForLog = (feature: string, error: unknown): string => {
  const err: any = unwrapRetry(error)
  const lines = [`${feature} model call failed: ${err?.constructor?.name || 'Error'}: ${clip(err?.message || err)}`]
  if (err?.responseBody) lines.push(`  responseBody: ${clip(err.responseBody)}`)
  if (err?.statusCode) lines.push(`  statusCode: ${err.statusCode}`)
  if (err?.url) lines.push(`  url: ${clip(err.url)}`)
  if (err?.cause) lines.push(`  cause: ${err.cause?.constructor?.name || ''} ${clip(err.cause?.message || err.cause)}`)
  if (err?.stack) lines.push(...stackFrames(err.stack))
  return lines.join('\n')
}
