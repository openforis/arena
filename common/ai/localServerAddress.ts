/**
 * Classifies a local AI server URL from the URL alone (the browser cannot resolve DNS):
 * loopback → onDevice, allowlisted → orgHosted, anything else → cloud.
 */
import type { AiHostingClass } from '@common/ai/policy'

import { isAllowlisted } from '@common/ai/allowlist'

const IPV4_OCTET = /^(0|[1-9]\d{0,2})$/
const IPV6_GROUP = /^[0-9a-f]{1,4}$/i

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
 * Parses a dotted-quad IPv4 address (the form the URL parser produces).
 * @param {string} host - Host.
 * @returns {number[]|null} The 4 octets, or null.
 */
export const parseIpv4 = (host: string): number[] | null => {
  const parts = host.split('.')
  if (parts.length !== 4 || !parts.every((part) => IPV4_OCTET.test(part))) return null
  const octets = parts.map(Number)
  return octets.every((octet) => octet <= 255) ? octets : null
}

const parseIpv6Groups = (part: string): number[] | null => {
  if (part === '') return []
  const groups: number[] = []
  for (const group of part.split(':')) {
    if (!IPV6_GROUP.test(group)) return null
    groups.push(Number.parseInt(group, 16))
  }
  return groups
}

/**
 * Parses an IPv6 address in hexadecimal groups, with at most one "::" (the URL parser's form, without brackets).
 * @param {string} host - Host.
 * @returns {number[]|null} The 8 groups, or null.
 */
export const parseIpv6 = (host: string): number[] | null => {
  if (!host.includes(':')) return null
  const halves = host.split('::')
  if (halves.length > 2) return null
  const head = parseIpv6Groups(halves[0])
  const tail = halves.length === 2 ? parseIpv6Groups(halves[1]) : []
  if (!head || !tail) return null
  if (halves.length === 1) return head.length === 8 ? head : null
  const missing = 8 - head.length - tail.length
  if (missing < 1) return null
  return [...head, ...new Array<number>(missing).fill(0), ...tail]
}

// ::ffff:a.b.c.d (the URL parser writes it as ::ffff:xxxx:yyyy)
const toMappedIpv4 = (groups: number[]): number[] | null => {
  const prefixIsZero = groups.slice(0, 5).every((group) => group === 0)
  if (!prefixIsZero || groups[5] !== 0xffff) return null
  return [groups[6] >> 8, groups[6] & 255, groups[7] >> 8, groups[7] & 255]
}

const toIpv4 = (host: string): number[] | null => {
  const ipv4 = parseIpv4(host)
  if (ipv4) return ipv4
  const ipv6 = parseIpv6(host)
  return ipv6 ? toMappedIpv4(ipv6) : null
}

const isIpv6Loopback = (groups: number[]): boolean =>
  groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1

/**
 * Returns true for loopback hosts: localhost, *.localhost, 127.0.0.0/8, ::1 (and ::ffff:127.x.x.x).
 * @param {string} hostname - URL hostname (IPv6 with or without brackets).
 * @returns {boolean} True when loopback.
 */
export const isLoopbackHost = (hostname: string): boolean => {
  const host = normalizeHost(hostname)
  if (host === 'localhost' || host.endsWith('.localhost')) return true
  const ipv4 = toIpv4(host)
  if (ipv4) return ipv4[0] === 127
  const ipv6 = parseIpv6(host)
  return !!ipv6 && isIpv6Loopback(ipv6)
}

const isPrivateIpv4 = ([a, b]: number[]): boolean =>
  a === 10 ||
  (a === 172 && b >= 16 && b <= 31) ||
  (a === 192 && b === 168) ||
  (a === 169 && b === 254) ||
  (a === 100 && b >= 64 && b <= 127)

const isPrivateIpv6 = (groups: number[]): boolean => (groups[0] & 0xfe00) === 0xfc00 || (groups[0] & 0xffc0) === 0xfe80

const isPrivateHost = (hostname: string): boolean => {
  const host = normalizeHost(hostname)
  if (host.endsWith('.local')) return true
  const ipv4 = toIpv4(host)
  if (ipv4) return isPrivateIpv4(ipv4)
  const ipv6 = parseIpv6(host)
  return !!ipv6 && isPrivateIpv6(ipv6)
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
