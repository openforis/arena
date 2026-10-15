/**
 * Classifies a local AI server URL from the URL alone (the browser cannot resolve DNS):
 * loopback → onDevice, allowlisted → orgHosted, anything else → cloud.
 */
import type { AiHostingClass } from '@common/ai/policy'

import { isAllowlisted } from '@common/ai/allowlist'
import { classifyIpAddress } from '@common/ai/ipAddress'

// the parsers moved to the shared IP classification; they stay importable from here
export { parseIpv4, parseIpv6 } from '@common/ai/ipAddress'

const parseHttpUrl = (value: string): URL | null => {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

const normalizeHost = (hostname: string): string =>
  hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')

/**
 * Returns true for loopback hosts: localhost, *.localhost, 127.0.0.0/8, ::1 (and ::ffff:127.x.x.x).
 * @param {string} hostname - URL hostname (IPv6 with or without brackets).
 * @returns {boolean} True when loopback.
 */
export const isLoopbackHost = (hostname: string): boolean => {
  const host = normalizeHost(hostname)
  return host === 'localhost' || host.endsWith('.localhost') || classifyIpAddress(host) === 'loopback'
}

/**
 * Returns true for hosts of the local network: private and link-local IPv4, CGNAT, IPv6 ULA, link-local and site-local,
 * .local.
 * @param {string} hostname - URL hostname (IPv6 with or without brackets).
 * @returns {boolean} True when private.
 */
export const isPrivateHost = (hostname: string): boolean => {
  const host = normalizeHost(hostname)
  return host.endsWith('.local') || classifyIpAddress(host) === 'private'
}

// user:password@ in the authority (an empty user or password counts too)
const USERINFO = /^[a-z][a-z\d+.-]*:\/\/[^/?#]*@/i

/**
 * Returns true when the address is a plain http(s) base URL of a server: no credentials (user:pass@), no query and
 * no fragment. Those would be sent with every request (fetch refuses a URL with credentials), break the paths
 * appended to the base URL, and end up in the consent record and the logs of the server.
 * @param {string} url - Base URL with a scheme.
 * @returns {boolean} True for a plain http(s) URL.
 */
export const isPlainHttpBaseUrl = (url: string): boolean => {
  const parsed = parseHttpUrl(url)
  if (!parsed) return false
  // `?` and `#` are tested on the text: the parsed query and fragment of "http://h/v1?" are empty
  return !USERINFO.test(url) && !parsed.username && !parsed.password && !url.includes('?') && !url.includes('#')
}

/**
 * Returns the hosting class of a local AI server URL.
 * @param {string} url - Server base URL typed by the user.
 * @param {string[]} allowlist - Org-hosted base URLs (AI_ORG_HOSTED_BASE_URLS).
 * @returns {AiHostingClass} onDevice for loopback, orgHosted when allowlisted, otherwise cloud (also for invalid URLs).
 */
export const getLocalServerHostingClass = (url: string, allowlist: string[]): AiHostingClass => {
  const parsed = parseHttpUrl(url)
  if (!parsed) return 'cloud'
  if (isLoopbackHost(parsed.hostname)) return 'onDevice'
  return isAllowlisted(parsed, allowlist) ? 'orgHosted' : 'cloud'
}

/**
 * Returns the fetch `targetAddressSpace` to request for a URL (Chrome Local Network Access), or null.
 * @param {string} url - Request URL.
 * @returns {'local'|null} 'local' for private, link-local, CGNAT and .local hosts; null otherwise.
 */
export const getTargetAddressSpace = (url: string): 'local' | null => {
  const parsed = parseHttpUrl(url)
  if (!parsed || isLoopbackHost(parsed.hostname)) return null
  return isPrivateHost(parsed.hostname) ? 'local' : null
}

// "any address" hosts: a server listening on them is reached through this machine
const UNSPECIFIED_HOSTS = new Set(['0.0.0.0', '::'])
const URL_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i

/**
 * Adds http:// to an address typed without a scheme (localhost:1234/v1).
 * @param {string} url - Typed address.
 * @returns {string} The trimmed address with a scheme.
 */
export const withDefaultHttpScheme = (url: string): string => {
  const trimmed = url.trim()
  return URL_SCHEME.test(trimmed) ? trimmed : `http://${trimmed}`
}

/**
 * Returns true when a typed base URL points to this computer or the local network (the Arena server never calls it).
 * @param {string} url - Typed base URL, with or without scheme.
 * @returns {boolean} True for loopback, unspecified, private, link-local and .local hosts.
 */
export const isLocalOrPrivateUrl = (url: string): boolean => {
  if (typeof url !== 'string' || !url.trim()) return false
  const parsed = parseHttpUrl(withDefaultHttpScheme(url))
  if (!parsed) return false
  const host = normalizeHost(parsed.hostname)
  return UNSPECIFIED_HOSTS.has(host) || isLoopbackHost(host) || isPrivateHost(host)
}

/**
 * Returns true when a typed base URL is on the organisation allowlist (org-hosted: the server may call it).
 * @param {string} url - Typed base URL, with or without scheme.
 * @param {string[]} allowlist - Org-hosted base URLs (AI_ORG_HOSTED_BASE_URLS).
 * @returns {boolean} True when allowlisted.
 */
export const isOrgHostedUrl = (url: string, allowlist: string[]): boolean => {
  if (typeof url !== 'string' || !url.trim()) return false
  const parsed = parseHttpUrl(withDefaultHttpScheme(url))
  return !!parsed && isAllowlisted(parsed, allowlist)
}
