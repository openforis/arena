/**
 * Org-hosted base URL allowlist matching (AI_ORG_HOSTED_BASE_URLS), shared by the server guard and the browser.
 */

import { AiProvider } from './aiProvider'

// the providers that call a base URL chosen by the user or the admin
const BASE_URL_TYPES = new Set<string>([AiProvider.openaiCompatible, AiProvider.vercelAiSdk])

/**
 * Returns true when the provider type calls a base URL chosen by the user.
 * @param {string} type - Provider type.
 * @returns {boolean} Whether the type uses a base URL.
 */
export const providerTypeUsesBaseUrl = (type: string): boolean => BASE_URL_TYPES.has(type)

/**
 * Removes the trailing slashes (a loop, not a regex: no backtracking on long input).
 * @param {string} value - URL or path.
 * @returns {string} The value without trailing slashes.
 */
export const stripTrailingSlashes = (value: string): string => {
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end -= 1
  return value.slice(0, end)
}

/**
 * Parses a URL, returning null when it is not valid.
 * @param {string} value - The text to parse.
 * @returns {URL|null} The URL or null.
 */
export const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const matchesAllowlistEntry = (url: URL, entry: string): boolean => {
  const allowed = parseUrl(entry)
  if (!allowed || allowed.origin !== url.origin) return false
  const allowedPath = stripTrailingSlashes(allowed.pathname)
  const path = stripTrailingSlashes(url.pathname)
  // path-segment boundary: /v1 allows /v1 and /v1/chat, not /v10
  return path === allowedPath || path.startsWith(`${allowedPath}/`)
}

/**
 * Returns true when the URL is under one of the org-hosted base URLs.
 * @param {URL} url - The URL to check.
 * @param {string[]} allowlist - Allowed base URLs (origin + path prefix).
 * @returns {boolean} True when allowlisted.
 */
export const isAllowlisted = (url: URL, allowlist: string[]): boolean =>
  allowlist.some((entry) => typeof entry === 'string' && matchesAllowlistEntry(url, entry))
