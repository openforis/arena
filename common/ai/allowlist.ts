/**
 * Org-hosted base URL allowlist matching (AI_ORG_HOSTED_BASE_URLS), shared by the server guard and the browser.
 */

const trimTrailingSlashes = (path: string): string => {
  let end = path.length
  while (end > 0 && path[end - 1] === '/') end -= 1
  return path.slice(0, end)
}

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const matchesAllowlistEntry = (url: URL, entry: string): boolean => {
  const allowed = parseUrl(entry)
  if (!allowed || allowed.origin !== url.origin) return false
  const allowedPath = trimTrailingSlashes(allowed.pathname)
  const path = trimTrailingSlashes(url.pathname)
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
