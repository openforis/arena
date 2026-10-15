/**
 * SSRF guard for base URLs typed by users (openai-compatible / vercel-ai-sdk providers): the server must not
 * become a proxy towards internal addresses. Org-hosted model servers are allowed via AI_ORG_HOSTED_BASE_URLS.
 *
 * The check here runs before a request, to refuse a base URL with a clear error. It is not what protects the
 * server: the name is resolved again when the request connects, and a DNS server can answer differently the second
 * time (DNS rebinding). The requests to a user's endpoint are made by `guardedFetch`, which applies the same address
 * rules (`areAddressesAllowed`) on the addresses it connects to, and refuses redirects.
 */
import { lookup as dnsLookup } from 'node:dns/promises'
import { isIP } from 'node:net'

import { ENV } from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'
import { AiProvider } from '@common/ai/aiProvider'
import { isAllowlisted } from '@common/ai/allowlist'
import { isNonPublicIpAddress } from '@common/ai/ipAddress'

export { isAllowlisted }

export type LookupFn = (
  hostname: string,
  options: { all: true; verbatim: true }
) => Promise<{ address: string; family: number }[]>

export type GuardOptions = { allowlist?: string[]; lookup?: LookupFn }

// the system resolver, which answers with every address of a name
export const defaultLookup = dnsLookup as unknown as LookupFn

const PROVIDERS_WITH_USER_BASE_URL = new Set<string>([AiProvider.openaiCompatible, AiProvider.vercelAiSdk])

export const notAllowed = (baseUrl: string) =>
  new SystemError('aiBaseUrlNotAllowed', { baseUrl: String(baseUrl).slice(0, 200) }, StatusCodes.BAD_REQUEST)

/**
 * Returns true when the address must not be called (internal, reserved, or not an IP at all). The ranges are the ones
 * the browser uses to tell the local network from the internet (common/ai/ipAddress).
 * @param {string} address - IPv4 or IPv6 address.
 * @returns {boolean} True when blocked.
 */
export const isBlockedAddress = (address: string): boolean => isNonPublicIpAddress(address)

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * Returns true when every address may be called (and there is at least one).
 * @param {string[]} addresses - Resolved IPv4 / IPv6 addresses.
 * @returns {boolean} Whether the server may connect to them.
 */
export const areAddressesAllowed = (addresses: string[]): boolean =>
  addresses.length > 0 && !addresses.some(isBlockedAddress)

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
  { allowlist = ENV.aiOrgHostedBaseUrls, lookup = defaultLookup }: GuardOptions = {}
): Promise<void> => {
  const url = parseUrl(baseUrl)
  if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) throw notAllowed(baseUrl)
  if (isAllowlisted(url, allowlist)) return

  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(hostname) ? [hostname] : await resolveAddresses(hostname, lookup)
  if (!areAddressesAllowed(addresses)) throw notAllowed(baseUrl)
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
