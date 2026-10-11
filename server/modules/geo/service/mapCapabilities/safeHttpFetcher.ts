import { promises as dnsPromises } from 'node:dns'
import http from 'node:http'
import https from 'node:https'

import axios, { type AxiosRequestConfig } from 'axios'

import {
  getIpFamily,
  isPublicIpAddress,
  stripBrackets,
} from '@server/modules/geo/service/mapCapabilities/ipAddressRanges'
import { isMapCustomLayersError, newMapCustomLayersError } from '@server/modules/geo/service/mapCustomLayersErrors'

export type ResolvedAddress = { address: string; family: 4 | 6 }
export type DnsLookup = (hostname: string) => Promise<Array<{ address: string; family: number }>>
export type PinnedLookup = (
  hostname: string,
  options: { all?: boolean } | number | null | undefined,
  callback: (error: Error | null, addressOrAddresses: ResolvedAddress[] | string, family?: number) => void
) => void
export type SafeRequestConfig = {
  responseType: 'arraybuffer'
  maxRedirects: number
  proxy: false
  timeout: number
  signal: AbortSignal
  maxContentLength: number
  validateStatus: (status: number) => boolean
  headers: Record<string, string>
  lookup: PinnedLookup
}
export type HttpResponse = { status: number; headers: Record<string, unknown>; data: ArrayBuffer | Uint8Array }
export type HttpGet = (url: string, config: SafeRequestConfig) => Promise<HttpResponse>
export type FetchedText = { body: string; contentType: string }
export type SafeHttpFetcher = { fetchText: (url: URL) => Promise<FetchedText> }

export const CAPABILITIES_TIMEOUT_MS = 10_000
export const CAPABILITIES_MAX_BYTES = 2 * 1024 * 1024

const REDIRECT_LOCATION_MAX_LENGTH = 300
const TIMEOUT_ERROR_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT', 'ERR_CANCELED'])
const TIMEOUT_ERROR_NAMES = new Set(['AbortError', 'CanceledError', 'TimeoutError'])
const XML_LIKE_CONTENT_TYPES = ['', 'text/plain', 'application/octet-stream']

/**
 * Resolves a host name with the operating system resolver, returning every address.
 * @param {string} hostname - The host name.
 * @returns {Promise<Array<{address: string, family: number}>>} The addresses.
 */
const defaultDnsLookup: DnsLookup = (hostname) => dnsPromises.lookup(hostname, { all: true })

/**
 * Sends the GET request with axios, on dedicated non-keep-alive agents.
 * @param {string} url - The URL.
 * @param {SafeRequestConfig} config - The request configuration.
 * @returns {Promise<HttpResponse>} The response.
 */
const defaultHttpGet: HttpGet = async (url, config) => {
  // Dedicated agents, created per request: no socket is reused across hosts, and an agent set by the environment
  // (NODE_USE_ENV_PROXY, HTTP_PROXY) cannot replace them, so the pinned lookup is always the one that connects.
  const response = await axios.get(url, {
    ...(config as unknown as AxiosRequestConfig),
    httpAgent: new http.Agent({ keepAlive: false }),
    httpsAgent: new https.Agent({ keepAlive: false }),
  })
  return { status: response.status, headers: response.headers as Record<string, unknown>, data: response.data }
}

/**
 * Tells whether a host name is a localhost name, which always points to the server itself.
 * @param {string} hostname - The lower-case host name.
 * @returns {boolean} True for "localhost" and its subdomains.
 */
const isLocalhostName = (hostname: string): boolean => hostname === 'localhost' || hostname.endsWith('.localhost')

/**
 * Runs the DNS lookup with a time limit, so a resolver that never answers cannot hang the request.
 * @param {object} params - Parameters.
 * @param {string} params.host - The host name.
 * @param {DnsLookup} params.dnsLookup - The resolver.
 * @param {number} params.timeoutMs - The time limit.
 * @returns {Promise<Array<{address: string, family: number}>>} The addresses.
 * @throws {SystemError} timeout when the resolver does not answer in time; hostNotFound when it fails.
 */
const lookupWithTimeout = async ({
  host,
  dnsLookup,
  timeoutMs,
}: {
  host: string
  dnsLookup: DnsLookup
  timeoutMs: number
}): Promise<Array<{ address: string; family: number }>> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(newMapCustomLayersError('timeout', { seconds: timeoutMs / 1000 })), timeoutMs)
  })
  try {
    return await Promise.race([dnsLookup(host), timeout])
  } catch (error) {
    if (isMapCustomLayersError(error)) throw error
    throw newMapCustomLayersError('hostNotFound', { host })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Resolves the host of a URL and checks that every address is public. Refusing when ANY answer is private blocks DNS
 * answers that mix a public and a private address.
 * @param {object} params - Parameters.
 * @param {string} params.hostname - The URL host name (IPv6 literals in brackets).
 * @param {DnsLookup} params.dnsLookup - The resolver.
 * @param {number} [params.timeoutMs] - The time limit of the DNS lookup.
 * @returns {Promise<ResolvedAddress[]>} The vetted addresses.
 * @throws {SystemError} urlNotAllowed, hostNotFound or timeout.
 */
export const resolvePublicAddresses = async ({
  hostname,
  dnsLookup,
  timeoutMs = CAPABILITIES_TIMEOUT_MS,
}: {
  hostname: string
  dnsLookup: DnsLookup
  timeoutMs?: number
}): Promise<ResolvedAddress[]> => {
  const host = stripBrackets(hostname).toLowerCase()
  const literalFamily = getIpFamily(host)
  if (literalFamily !== 0) {
    if (!isPublicIpAddress(host)) throw newMapCustomLayersError('urlNotAllowed')
    return [{ address: host, family: literalFamily }]
  }
  if (isLocalhostName(host)) throw newMapCustomLayersError('urlNotAllowed')
  const answers = await lookupWithTimeout({ host, dnsLookup, timeoutMs })
  if (answers.length === 0) throw newMapCustomLayersError('hostNotFound', { host })
  if (answers.some(({ address }) => !isPublicIpAddress(address))) throw newMapCustomLayersError('urlNotAllowed')
  return answers.map(({ address, family }) => ({ address, family: family === 6 ? 6 : 4 }))
}

/**
 * Creates a DNS lookup that always answers with the vetted addresses, so the connection goes to them even if the
 * name would resolve differently a second time (DNS rebinding). TLS SNI and the Host header still use the name.
 * @param {ResolvedAddress[]} addresses - The vetted addresses.
 * @returns {PinnedLookup} The lookup function for the HTTP agent: the array of addresses when options.all is set,
 * otherwise the first one.
 */
export const createPinnedLookup =
  (addresses: ResolvedAddress[]): PinnedLookup =>
  (_hostname, options, callback) => {
    if (typeof options === 'object' && options?.all) callback(null, addresses)
    else callback(null, addresses[0].address, addresses[0].family)
  }

/**
 * Builds the request configuration: pinned addresses, no proxy, no redirects, a time limit and a size limit.
 * @param {object} params - Parameters.
 * @param {ResolvedAddress[]} params.addresses - The vetted addresses.
 * @param {number} params.timeoutMs - The time limit of the whole request.
 * @param {number} params.maxBytes - The size limit of the (decompressed) body.
 * @returns {SafeRequestConfig} The configuration.
 */
export const buildRequestConfig = ({
  addresses,
  timeoutMs,
  maxBytes,
}: {
  addresses: ResolvedAddress[]
  timeoutMs: number
  maxBytes: number
}): SafeRequestConfig => ({
  responseType: 'arraybuffer',
  maxRedirects: 0,
  proxy: false, // a proxy would resolve the name itself and bypass the pinned addresses
  timeout: timeoutMs,
  signal: AbortSignal.timeout(timeoutMs), // also bounds a body that trickles in slowly
  maxContentLength: maxBytes,
  validateStatus: () => true, // statuses are mapped to errors below
  headers: { Accept: 'application/xml, text/xml;q=0.9, */*;q=0.1' },
  lookup: createPinnedLookup(addresses),
})

/**
 * Maps a transport error to the error sent to the client.
 * @param {unknown} error - The error thrown by the HTTP client.
 * @param {object} limits - The limits used by the request.
 * @param {number} limits.timeoutMs - The time limit.
 * @param {number} limits.maxBytes - The size limit.
 * @returns {Error} timeout, responseTooLarge or unreachable (custom layer errors are returned as they are).
 */
export const toFetchError = (
  error: unknown,
  { timeoutMs, maxBytes }: { timeoutMs: number; maxBytes: number }
): Error => {
  if (isMapCustomLayersError(error)) return error as Error
  const { code = '', name = '', message = '' } = (error ?? {}) as { code?: string; name?: string; message?: string }
  if (String(message).includes('maxContentLength')) {
    return newMapCustomLayersError('responseTooLarge', { limitMb: maxBytes / (1024 * 1024) })
  }
  if (TIMEOUT_ERROR_CODES.has(code) || TIMEOUT_ERROR_NAMES.has(name)) {
    return newMapCustomLayersError('timeout', { seconds: timeoutMs / 1000 })
  }
  return newMapCustomLayersError('unreachable')
}

/**
 * Tells whether a response body can be a capabilities document.
 * @param {object} params - Parameters.
 * @param {string} params.contentType - The lower-case Content-Type header.
 * @param {string} params.body - The body.
 * @returns {boolean} True for XML content types, and for generic ones when the body starts with "<".
 */
const isXmlResponse = ({ contentType, body }: { contentType: string; body: string }): boolean => {
  if (contentType.includes('xml')) return true
  const mimeType = contentType.split(';')[0].trim()
  return XML_LIKE_CONTENT_TYPES.includes(mimeType) && body.trimStart().startsWith('<')
}

/**
 * Checks the status and the type of a response and decodes its body.
 * @param {HttpResponse} response - The response.
 * @returns {FetchedText} The body (UTF-8, byte order mark removed) and the content type.
 * @throws {SystemError} redirectNotFollowed, fetchFailed or notCapabilities.
 */
const readResponse = (response: HttpResponse): FetchedText => {
  const { status, headers = {} } = response
  if (status >= 300 && status < 400) {
    const location = String(headers.location ?? '').slice(0, REDIRECT_LOCATION_MAX_LENGTH)
    throw newMapCustomLayersError('redirectNotFollowed', { location })
  }
  if (status < 200 || status >= 300) throw newMapCustomLayersError('fetchFailed', { status })
  const contentType = String(headers['content-type'] ?? '').toLowerCase()
  const body = new TextDecoder('utf-8').decode(response.data)
  if (!isXmlResponse({ contentType, body })) throw newMapCustomLayersError('notCapabilities')
  return { body, contentType }
}

/**
 * Creates the fetcher used for GetCapabilities requests to user-given URLs (SSRF-safe).
 * @param {object} [deps] - Dependencies and limits (the defaults are for production).
 * @param {DnsLookup} [deps.dnsLookup] - The resolver.
 * @param {HttpGet} [deps.httpGet] - The HTTP client.
 * @param {number} [deps.timeoutMs] - The time limit of a request.
 * @param {number} [deps.maxBytes] - The size limit of a response.
 * @returns {SafeHttpFetcher} The fetcher.
 */
export const createSafeHttpFetcher = ({
  dnsLookup = defaultDnsLookup,
  httpGet = defaultHttpGet,
  timeoutMs = CAPABILITIES_TIMEOUT_MS,
  maxBytes = CAPABILITIES_MAX_BYTES,
}: { dnsLookup?: DnsLookup; httpGet?: HttpGet; timeoutMs?: number; maxBytes?: number } = {}): SafeHttpFetcher => {
  /**
   * Fetches a document: vets the host, pins the connection, checks the response.
   * @param {URL} url - The user-given URL.
   * @returns {Promise<FetchedText>} The body and the content type.
   * @throws {SystemError} A map custom layers error.
   */
  const fetchText = async (url: URL): Promise<FetchedText> => {
    const addresses = await resolvePublicAddresses({ hostname: url.hostname, dnsLookup, timeoutMs })
    const config = buildRequestConfig({ addresses, timeoutMs, maxBytes })
    let response: HttpResponse
    try {
      response = await httpGet(url.toString(), config)
    } catch (error) {
      throw toFetchError(error, { timeoutMs, maxBytes })
    }
    return readResponse(response)
  }
  return { fetchText }
}
