/**
 * fetch with the Arena bearer token (the AI gateway streams, so it can't go through axios), refreshing an
 * expired token once like the axios interceptor in appErrorsMiddleware does. Concurrent refreshes are shared by
 * the injected refreshAuthToken (the app's is single-flight, like the one the axios interceptor uses).
 */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>

const UNAUTHORIZED = 401

/** Returns the request init with the bearer token and same-origin credentials. */
const withAuth = (init: RequestInit, token: string | null): RequestInit => {
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return { ...init, headers, credentials: 'same-origin' }
}

/**
 * Creates the authorized fetch.
 * @param {object} deps - Dependencies.
 * @param {FetchLike} deps.fetchImpl - Underlying fetch.
 * @param {Function} deps.getAuthToken - Returns the current token (or null).
 * @param {Function} deps.refreshAuthToken - Refreshes the token (sharing a refresh already in flight); resolves to the new token or null.
 * @returns {FetchLike} The authorized fetch.
 */
export const createAuthorizedFetch = ({
  fetchImpl,
  getAuthToken,
  refreshAuthToken,
}: {
  fetchImpl: FetchLike
  getAuthToken: () => string | null
  refreshAuthToken: () => Promise<string | null>
}): FetchLike => {
  return async (url, init) => {
    const response = await fetchImpl(url, withAuth(init, getAuthToken()))
    if (response.status !== UNAUTHORIZED) return response
    const token = await refreshAuthToken().catch(() => null)
    // the 401 is the answer when the token could not be refreshed: its body is for the caller
    if (!token) return response
    // the retry replaces this response: release its body, an unread one keeps the connection busy
    await response.body?.cancel().catch(() => undefined)
    return fetchImpl(url, withAuth(init, token))
  }
}
