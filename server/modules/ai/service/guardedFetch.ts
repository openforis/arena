/**
 * `fetch` for the endpoint of a user (openai-compatible and AI SDK base URLs): the address the connection is made to
 * is checked when the socket connects, with the rules of the base URL guard, so a name that resolves to a public
 * address for the pre-check and to an internal one for the request (DNS rebinding) is refused. Redirects are refused
 * too, and a response body over a cap is cut (a stream that never ends would fill the memory). Built on node:http(s)
 * and its `lookup` option, so it needs no dependency (undici is not one of ours, and the global fetch takes no
 * address check).
 */
import http from 'node:http'
import https from 'node:https'
import { isIP } from 'node:net'
import { Readable } from 'node:stream'

import { ENV } from '@core/processUtils'
import SystemError from '@core/systemError'

import {
  areAddressesAllowed,
  type GuardOptions,
  defaultLookup,
  isAllowlisted,
  isBlockedAddress,
  type LookupFn,
  notAllowed,
} from './baseUrlGuard'

export type GuardedFetch = (input: string | URL, init?: RequestInit) => Promise<Response>

type LookupCallback = (
  error: Error | null,
  address?: string | { address: string; family: number }[],
  family?: number
) => void

// the most a response may bring: far above a model answer, far below what exhausts the memory of the server
export const DEFAULT_MAX_BODY_BYTES = 32 * 1024 * 1024

// the most the body of an error answer may bring: an error message is short, so this is read whole and nothing more
export const MAX_ERROR_BODY_BYTES = 64 * 1024

// statuses a Response cannot have a body for
const NULL_BODY_STATUSES = new Set([204, 205, 304])

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

/**
 * Builds the `lookup` option of a socket: it resolves the name and gives the socket only addresses the guard allows.
 * @param {string} url - The requested URL (for the error).
 * @param {LookupFn} lookup - DNS lookup that answers every address of a name.
 * @returns {Function} The socket lookup.
 */
const createConnectLookup =
  (url: string, lookup: LookupFn) =>
  (hostname: string, options: { all?: boolean }, callback: LookupCallback): void => {
    lookup(hostname, { all: true, verbatim: true }).then(
      (addresses) => {
        if (!areAddressesAllowed(addresses.map(({ address }) => address))) {
          callback(notAllowed(url))
        } else if (options?.all) {
          callback(null, addresses)
        } else {
          callback(null, addresses[0].address, addresses[0].family)
        }
      },
      (error) => callback(error)
    )
  }

/**
 * Returns the body of a request as bytes (the bodies the AI SDK and the discovery send).
 * @param {BodyInit|null|undefined} body - Request body.
 * @returns {Buffer|null} The bytes, or null when there is no body.
 * @throws {TypeError} When the body is of a kind that is not supported (stream, blob, form data).
 */
const toBodyBytes = (body: BodyInit | null | undefined): Buffer | null => {
  if (body === null || body === undefined) return null
  if (typeof body === 'string') return Buffer.from(body, 'utf8')
  if (body instanceof URLSearchParams) return Buffer.from(body.toString(), 'utf8')
  if (body instanceof ArrayBuffer) return Buffer.from(body)
  if (ArrayBuffer.isView(body)) return Buffer.from(body.buffer, body.byteOffset, body.byteLength)
  throw new TypeError('guardedFetch: unsupported request body')
}

/**
 * Returns the headers of a response.
 * @param {http.IncomingHttpHeaders} raw - Node headers.
 * @returns {Headers} The headers.
 */
const toHeaders = (raw: http.IncomingHttpHeaders): Headers => {
  const headers = new Headers()
  for (const [name, value] of Object.entries(raw)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) headers.append(name, item)
    }
  }
  return headers
}

/**
 * Returns the error a failed request rejects with: a SystemError of the guard as it is, anything else as the
 * TypeError("fetch failed") of fetch, which is what the AI SDK recognises as a connection failure.
 * @param {unknown} error - The socket error.
 * @returns {Error} The error.
 */
const toFetchError = (error: unknown): Error =>
  error instanceof SystemError ? error : new TypeError('fetch failed', { cause: error })

/**
 * Throws when the host is an IP address the guard does not allow (a socket does no lookup for an IP, so the connect
 * lookup never sees it).
 * @param {URL} url - The URL.
 * @param {string[]} allowlist - Org-hosted base URLs.
 * @returns {void}
 */
const assertLiteralAddressAllowed = (url: URL, allowlist: string[]): void => {
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(hostname) && !isAllowlisted(url, allowlist) && isBlockedAddress(hostname)) throw notAllowed(url.href)
}

/**
 * Fails the body of a response (and closes the connection) when it brings more than the cap: the given one for a
 * success, and at most 64 KiB for an error.
 * @param {http.IncomingMessage} incoming - The response.
 * @param {number} maxBodyBytes - The most the body may bring.
 * @returns {void}
 */
const capBody = (incoming: http.IncomingMessage, maxBodyBytes: number): void => {
  const status = incoming.statusCode ?? 0
  const cap = status >= 200 && status < 300 ? maxBodyBytes : Math.min(maxBodyBytes, MAX_ERROR_BODY_BYTES)
  let received = 0
  incoming.on('data', (chunk: Buffer) => {
    received += chunk.length
    if (received > cap) incoming.destroy(new TypeError('response body too large'))
  })
}

/**
 * Sends the request and resolves with its response as soon as the headers arrive (the body streams).
 * @param {object} params - Parameters.
 * @param {URL} params.url - The URL.
 * @param {RequestInit} params.init - Fetch options.
 * @param {Function|undefined} params.lookup - Socket lookup, undefined for an allowlisted host.
 * @param {number} params.maxBodyBytes - The most the body of the response may bring.
 * @returns {Promise<Response>} The response.
 */
const send = ({
  url,
  init,
  lookup,
  maxBodyBytes,
}: {
  url: URL
  init: RequestInit
  lookup: ReturnType<typeof createConnectLookup> | undefined
  maxBodyBytes: number
}): Promise<Response> =>
  new Promise<Response>((resolve, reject) => {
    const { signal } = init
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }
    const body = toBodyBytes(init.body)
    const headers: Record<string, string> = { 'accept-encoding': 'identity' }
    new Headers(init.headers).forEach((value, name) => {
      headers[name] = value
    })
    if (body) headers['content-length'] = String(body.length)
    const transport = url.protocol === 'https:' ? https : http
    // a new connection for every request: nothing is reused after the address of a connection was checked
    const request = transport.request(url, { method: init.method ?? 'GET', headers, lookup, agent: false } as any)
    let incomingResponse: http.IncomingMessage | undefined
    // like fetch, an abort rejects the request, or fails the body being read, with the reason of the signal
    const onAbort = () => {
      request.destroy()
      incomingResponse?.destroy(signal?.reason)
      reject(signal?.reason)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    request.on('error', (error) => {
      signal?.removeEventListener('abort', onAbort)
      reject(toFetchError(error))
    })
    request.on('response', (incoming) => {
      incomingResponse = incoming
      const status = incoming.statusCode ?? 0
      if (REDIRECT_STATUSES.has(status)) {
        incoming.destroy()
        signal?.removeEventListener('abort', onAbort)
        reject(new TypeError('fetch failed', { cause: new Error('unexpected redirect') }))
        return
      }
      incoming.on('close', () => signal?.removeEventListener('abort', onAbort))
      capBody(incoming, maxBodyBytes)
      const hasBody = !NULL_BODY_STATUSES.has(status)
      if (!hasBody) incoming.resume()
      resolve(
        new Response(hasBody ? (Readable.toWeb(incoming) as ReadableStream) : null, {
          status,
          statusText: incoming.statusMessage,
          headers: toHeaders(incoming.headers),
        })
      )
    })
    if (body) request.end(body)
    else request.end()
  })

/**
 * Creates the `fetch` of the endpoint of a user.
 * @param {object} [options] - Guard options (see baseUrlGuard).
 * @param {string[]} [options.allowlist] - Org-hosted base URLs, which may be on an internal address (default: AI_ORG_HOSTED_BASE_URLS).
 * @param {LookupFn} [options.lookup] - DNS lookup (injectable for tests).
 * @param {number} [options.maxBodyBytes] - The most a response body may bring (default 32 MiB).
 * @param {number} [options.timeoutMs] - Time a call with no signal of its own may take (default: AI_REQUEST_TIMEOUT_MS).
 * @returns {GuardedFetch} A fetch that refuses internal addresses at connect time and redirects, and cuts a response
 *   that is too large.
 */
export const createGuardedFetch = ({
  allowlist = ENV.aiOrgHostedBaseUrls ?? [],
  lookup = defaultLookup,
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
  timeoutMs = ENV.aiRequestTimeoutMs,
}: GuardOptions & { maxBodyBytes?: number; timeoutMs?: number } = {}): GuardedFetch => {
  return async (input, init = {}) => {
    const url = new URL(String(input))
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw notAllowed(String(input))
    assertLiteralAddressAllowed(url, allowlist)
    const connectLookup = isAllowlisted(url, allowlist) ? undefined : createConnectLookup(url.href, lookup)
    // a caller that passes no signal (model discovery, the connection test) still cannot hang on a silent server
    const signal = init.signal ?? AbortSignal.timeout(timeoutMs)
    return send({ url, init: { ...init, signal }, lookup: connectLookup, maxBodyBytes })
  }
}
