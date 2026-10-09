/**
 * SSRF guard for base URLs typed by users (openai-compatible / vercel-ai-sdk providers): the server must not
 * become a proxy towards internal addresses. Org-hosted model servers are allowed via AI_ORG_HOSTED_BASE_URLS.
 *
 * Known limits (documented, accepted for step A): the name is resolved here and again by fetch, so a DNS server
 * answering differently the second time (DNS rebinding) is not caught. Redirects are refused by the callers
 * (redirect: 'error'), so they cannot bypass the check. Deployments that need more should route egress through a proxy.
 */
import { lookup as dnsLookup } from 'node:dns/promises'
import { BlockList, isIP, isIPv4 } from 'node:net'

import { ENV } from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'
import { AiProvider } from '@common/ai/aiProvider'
import { isAllowlisted } from '@common/ai/allowlist'

export { isAllowlisted }

export type LookupFn = (
  hostname: string,
  options: { all: true; verbatim: true }
) => Promise<{ address: string; family: number }[]>

type GuardOptions = { allowlist?: string[]; lookup?: LookupFn }

const IPV4_BLOCKED: [string, number][] = [
  ['0.0.0.0', 8], // "this" network
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local (cloud metadata)
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + broadcast
]

const IPV6_BLOCKED: [string, number][] = [
  ['::', 96], // unspecified, loopback, IPv4-compatible
  ['64:ff9b::', 96], // NAT64 (can reach internal IPv4)
  ['64:ff9b:1::', 48], // local-use NAT64
  ['2002::', 16], // 6to4 (embeds an IPv4)
  ['2001::', 32], // Teredo (embeds an IPv4)
  ['::ffff:0:0:0', 96], // IPv4-translated (SIIT)
  ['fc00::', 7], // unique local
  ['fe80::', 10], // link-local
  ['ff00::', 8], // multicast
]

const blockList = new BlockList()
for (const [network, prefix] of IPV4_BLOCKED) blockList.addSubnet(network, prefix, 'ipv4')
for (const [network, prefix] of IPV6_BLOCKED) blockList.addSubnet(network, prefix, 'ipv6')

const PROVIDERS_WITH_USER_BASE_URL = new Set<string>([AiProvider.openaiCompatible, AiProvider.vercelAiSdk])

const notAllowed = (baseUrl: string) =>
  new SystemError('aiBaseUrlNotAllowed', { baseUrl: String(baseUrl).slice(0, 200) }, StatusCodes.BAD_REQUEST)

// ::ffff:a.b.c.d and its hex form ::ffff:xxxx:yyyy (what the URL parser produces)
const toMappedIpv4 = (address: string): string | null => {
  const lower = address.toLowerCase()
  if (!lower.startsWith('::ffff:')) return null
  const rest = lower.slice('::ffff:'.length)
  if (isIPv4(rest)) return rest
  const match = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(rest)
  if (!match) return null
  const high = Number.parseInt(match[1], 16)
  const low = Number.parseInt(match[2], 16)
  return [high >> 8, high & 255, low >> 8, low & 255].join('.')
}

/**
 * Returns true when the address must not be called (internal, reserved, or not an IP at all).
 * @param {string} address - IPv4 or IPv6 address.
 * @returns {boolean} True when blocked.
 */
export const isBlockedAddress = (address: string): boolean => {
  const mapped = toMappedIpv4(address)
  if (mapped) return blockList.check(mapped, 'ipv4')
  const family = isIP(address)
  if (family === 0) return true
  return blockList.check(address, family === 4 ? 'ipv4' : 'ipv6')
}

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const resolveAddresses = async (hostname: string, lookup: LookupFn): Promise<string[]> => {
  try {
    const results = await lookup(hostname, { all: true, verbatim: true })
    return results.map(({ address }) => address)
  } catch {
    throw new SystemError('aiProviderUnavailable', {}, StatusCodes.BAD_GATEWAY)
  }
}

/**
 * Throws when the base URL points (directly or via DNS) to an address the server must not call.
 * @param {string} baseUrl - User-supplied base URL.
 * @param {object} [options] - Options.
 * @param {string[]} [options.allowlist] - Org-hosted base URLs (default: AI_ORG_HOSTED_BASE_URLS).
 * @param {LookupFn} [options.lookup] - DNS lookup (injectable for tests).
 * @returns {Promise<void>} Resolves when the URL is allowed.
 */
export const assertBaseUrlAllowed = async (
  baseUrl: string,
  { allowlist = ENV.aiOrgHostedBaseUrls, lookup = dnsLookup as unknown as LookupFn }: GuardOptions = {}
): Promise<void> => {
  const url = parseUrl(baseUrl)
  if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) throw notAllowed(baseUrl)
  if (isAllowlisted(url, allowlist)) return

  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(hostname) ? [hostname] : await resolveAddresses(hostname, lookup)
  if (addresses.length === 0 || addresses.some(isBlockedAddress)) throw notAllowed(baseUrl)
}

/**
 * Runs {@link assertBaseUrlAllowed} for the providers whose base URL is typed by the user.
 * @param {object} cfg - Provider config.
 * @param {string} cfg.provider - Provider key.
 * @param {string} [cfg.baseUrl] - Base URL.
 * @param {object} [options] - Guard options (see assertBaseUrlAllowed).
 * @returns {Promise<void>} Resolves when allowed (or not applicable).
 */
export const assertProviderBaseUrlAllowed = async (
  { provider, baseUrl }: { provider: string; baseUrl?: string | null },
  options?: GuardOptions
): Promise<void> => {
  if (!PROVIDERS_WITH_USER_BASE_URL.has(provider) || !baseUrl) return
  await assertBaseUrlAllowed(baseUrl, options)
}
