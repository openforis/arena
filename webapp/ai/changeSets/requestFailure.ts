/**
 * What a failed save request reports on the results of its operations (pure).
 */
import { isI18nKeyReason } from './types'

export type RequestFailure = { message: string; params: Record<string, unknown> }

const GENERIC_FAILURE_KEY = 'aiAssistant.card.applyFailed'

/**
 * Returns the message and params of a failed request: the server's error key with its params (the shape of the
 * response of a route error: `{ key, params }`; a key without a namespace belongs to `appErrors`), or the generic
 * "could not be applied" text with the error message when the server did not answer with a key (network error,
 * timeout, an error thrown by a store action).
 * @param {unknown} error - The error of the request (an axios error carries the response).
 * @returns {RequestFailure} The message key and its params.
 */
export const getRequestFailure = (error: any): RequestFailure => {
  const data = error?.response?.data
  if (typeof data?.key === 'string' && data.key !== '') {
    return { message: isI18nKeyReason(data.key) ? data.key : `appErrors:${data.key}`, params: data.params ?? {} }
  }
  return { message: GENERIC_FAILURE_KEY, params: { message: error instanceof Error ? error.message : String(error) } }
}
