/**
 * Error mapping and fetch wrapper of the local AI server: specific, translated errors instead of generic failures.
 */
import SystemError, { StatusCodes } from '@core/systemError'

import { getTargetAddressSpace } from '@common/ai/localServerAddress'

import type { AiEngineErrorInfo } from './types'

export type LocalServerFetchImpl = (url: string, init?: RequestInit) => Promise<Response>
export type FetchFunction = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

const PAYLOAD_TOO_LARGE = 413
const MAX_BODY_CHARS = 2000
const MODEL_MISSING_PATTERN = /model\b[^.]*\b(not found|not loaded|does not exist)|no models? (are )?loaded/i
const CONTEXT_PATTERN = /context (length|size|window)|exceed/i
const UNREACHABLE_KEY = 'aiLocalServerUnreachable'

/**
 * Tells whether an error is a user cancel or a timeout.
 * @param {any} error - The error.
 * @returns {boolean} True when abort-like.
 */
const isAbortLike = (error: any): boolean => error?.name === 'AbortError' || error?.name === 'TimeoutError'

/**
 * Maps an HTTP error of the local server to a SystemError.
 * @param {object} params - Parameters.
 * @param {number} params.status - HTTP status.
 * @param {string} params.bodyText - Response body (only inspected, never shown).
 * @param {string|null} params.modelId - Model the request was for.
 * @param {string} params.method - HTTP method (a 404 on GET /models is a wrong URL, not a missing model).
 * @returns {SystemError} The error.
 */
export const mapLocalServerHttpError = ({
  status,
  bodyText,
  modelId,
  method,
}: {
  status: number
  bodyText: string
  modelId: string | null
  method: string
}): SystemError => {
  const isPost = method.toUpperCase() === 'POST'
  const modelMissing =
    (isPost && status === StatusCodes.NOT_FOUND) ||
    (status === StatusCodes.BAD_REQUEST && MODEL_MISSING_PATTERN.test(bodyText))
  if (modelMissing)
    return new SystemError('aiLocalServerModelMissing', { modelId: modelId ?? '' }, StatusCodes.NOT_FOUND)
  if (status === StatusCodes.BAD_REQUEST && CONTEXT_PATTERN.test(bodyText)) {
    return new SystemError('aiLocalServerContextExceeded', {}, PAYLOAD_TOO_LARGE)
  }
  return new SystemError('aiLocalServerError', { status }, status >= 400 ? status : StatusCodes.BAD_GATEWAY)
}

/**
 * Maps a rejected fetch: a cancel is returned unchanged, anything else means the server could not be reached
 * (down, CORS off, Local Network Access denied; the browser does not tell them apart).
 * @param {object} params - Parameters.
 * @param {unknown} params.error - The fetch error.
 * @param {string} params.baseUrl - Server base URL (shown in the message).
 * @returns {unknown} The error to throw.
 */
export const mapLocalServerFetchError = ({ error, baseUrl }: { error: unknown; baseUrl: string }): unknown =>
  isAbortLike(error) ? error : new SystemError(UNREACHABLE_KEY, { baseUrl }, StatusCodes.SERVICE_UNAVAILABLE)

/**
 * Adds Chrome's Local Network Access opt-in (`targetAddressSpace: 'local'`) for private addresses, and refuses
 * redirects: the data class was decided from the configured address, a redirect could send the prompt elsewhere
 * (a refused redirect fails the fetch, which maps to the unreachable error).
 * @param {RequestInit} init - Request init.
 * @param {string} url - Request URL.
 * @returns {RequestInit} The init to use.
 */
export const withAddressSpace = (init: RequestInit, url: string): RequestInit => {
  const targetAddressSpace = getTargetAddressSpace(url)
  const strict: RequestInit = { ...init, redirect: 'error' }
  // not in the TypeScript DOM types yet
  return targetAddressSpace ? ({ ...strict, targetAddressSpace } as RequestInit) : strict
}

/**
 * Returns the URL of a fetch input.
 * @param {RequestInfo|URL} input - Fetch input.
 * @returns {string} The URL.
 */
const toUrlString = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

/**
 * Reads the beginning of an error response body, never throwing.
 * @param {Response} response - The response.
 * @returns {Promise<string>} The text (empty when unreadable).
 */
const readBodyText = async (response: Response): Promise<string> => {
  try {
    return (await response.text()).slice(0, MAX_BODY_CHARS)
  } catch {
    return ''
  }
}

/**
 * Creates the fetch used for every local server request.
 * @param {object} params - Parameters.
 * @param {LocalServerFetchImpl} params.fetchImpl - Underlying fetch (the browser's, bound).
 * @param {string} params.baseUrl - Server base URL.
 * @param {string|null} params.modelId - Chosen model.
 * @returns {FetchFunction} The fetch: resolves only with successful responses, rejects with mapped errors.
 */
export const createLocalServerFetch = ({
  fetchImpl,
  baseUrl,
  modelId,
}: {
  fetchImpl: LocalServerFetchImpl
  baseUrl: string
  modelId: string | null
}): FetchFunction => {
  return async (input, init = {}) => {
    const url = toUrlString(input)
    let response: Response
    try {
      response = await fetchImpl(url, withAddressSpace(init, url))
    } catch (error) {
      throw mapLocalServerFetchError({ error, baseUrl })
    }
    if (response.ok) return response
    const bodyText = await readBodyText(response)
    throw mapLocalServerHttpError({ status: response.status, bodyText, modelId, method: init.method ?? 'GET' })
  }
}

/**
 * Returns the key and params to show for a failed probe.
 * @param {unknown} error - The error.
 * @param {string} baseUrl - Server base URL.
 * @returns {AiEngineErrorInfo} The key and params.
 */
export const toEngineErrorInfo = (error: unknown, baseUrl: string): AiEngineErrorInfo =>
  error instanceof SystemError && error.key.startsWith('aiLocalServer')
    ? { key: error.key, params: error.params ?? {} }
    : { key: UNREACHABLE_KEY, params: { baseUrl } }
