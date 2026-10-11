import { newMapCustomLayersError } from '@server/modules/geo/service/mapCustomLayersErrors'

export const MAX_SERVICE_URL_LENGTH = 2048

const HTTP_PROTOCOLS = new Set(['http:', 'https:'])
const SERVICE_PARAM_KEYS = new Set(['service', 'request'])
const SUPPORTED_SERVICES = new Set(['WMS', 'WMTS'])

/**
 * Parses a URL without throwing.
 * @param {string} text - The URL, absolute or relative to baseUrl.
 * @param {string} [baseUrl] - The base URL.
 * @returns {URL|null} The URL, or null when it cannot be parsed.
 */
const tryParseUrl = (text: string, baseUrl?: string): URL | null => {
  try {
    return new URL(text, baseUrl)
  } catch {
    return null
  }
}

/**
 * Parses the service URL typed by the user. The URL parser also normalises numeric hosts ("0x7f.1", "2130706433"
 * become "127.0.0.1"), so the address checks of the fetcher see the real IP.
 * @param {unknown} value - The URL.
 * @returns {URL} The URL without fragment.
 * @throws {SystemError} urlInvalid when it is not a URL, urlNotAllowed when it is not plain http(s).
 */
export const parseServiceUrl = (value: unknown): URL => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length === 0 || text.length > MAX_SERVICE_URL_LENGTH) throw newMapCustomLayersError('urlInvalid')
  const url = tryParseUrl(text)
  if (!url) throw newMapCustomLayersError('urlInvalid')
  if (!HTTP_PROTOCOLS.has(url.protocol) || url.username || url.password) throw newMapCustomLayersError('urlNotAllowed')
  url.hash = ''
  return url
}

/**
 * Finds a query parameter by name, ignoring its case (OGC parameter names are case-insensitive).
 * @param {URL} url - The URL.
 * @param {string} name - The lower-case parameter name.
 * @returns {string|null} The value, or null when absent.
 */
const findParam = (url: URL, name: string): string | null => {
  for (const [key, value] of url.searchParams) {
    if (key.toLowerCase() === name) return value
  }
  return null
}

/**
 * Builds the GetCapabilities request of a service.
 * @param {URL} url - The service URL.
 * @param {string} service - WMS or WMTS.
 * @returns {string} The URL with SERVICE and REQUEST replaced.
 */
const withGetCapabilities = (url: URL, service: string): string => {
  const result = new URL(url.toString())
  for (const key of [...result.searchParams.keys()]) {
    if (SERVICE_PARAM_KEYS.has(key.toLowerCase())) result.searchParams.delete(key)
  }
  result.searchParams.set('SERVICE', service)
  result.searchParams.set('REQUEST', 'GetCapabilities')
  return result.toString()
}

/**
 * Lists the GetCapabilities requests to try, in order.
 * @param {URL} url - The service URL.
 * @returns {string[]} The URL itself for a ".xml" document; the named service when SERVICE is WMS or WMTS; else WMS
 * then WMTS.
 */
export const buildCapabilitiesUrls = (url: URL): string[] => {
  if (url.pathname.toLowerCase().endsWith('.xml')) return [url.toString()]
  const service = findParam(url, 'service')?.toUpperCase()
  if (service && SUPPORTED_SERVICES.has(service)) return [withGetCapabilities(url, service)]
  return [withGetCapabilities(url, 'WMS'), withGetCapabilities(url, 'WMTS')]
}

/**
 * Resolves a link found in a capabilities document (GetMap or GetTile endpoint). The browser loads tiles from it, so
 * an http link of the https host it was read from is upgraded, otherwise the browser would block it as mixed content.
 * @param {string} href - The link, absolute or relative.
 * @param {string} baseUrl - The capabilities request URL.
 * @returns {string|null} The absolute http(s) URL without fragment, or null when the link is not http(s).
 */
export const resolveServiceHref = (href: string, baseUrl: string): string | null => {
  const url = tryParseUrl(href.trim(), baseUrl)
  if (!url || !HTTP_PROTOCOLS.has(url.protocol)) return null
  const base = tryParseUrl(baseUrl)
  if (base?.protocol === 'https:' && url.protocol === 'http:' && url.hostname === base.hostname && url.port === '') {
    url.protocol = 'https:'
  }
  url.hash = ''
  return url.toString()
}
