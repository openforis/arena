/**
 * fetch with the Arena bearer token (the AI gateway streams, so it can't go through axios), refreshing an
 * expired token once like the axios interceptor in appErrorsMiddleware does.
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
 * @param {Function} deps.refreshAuthToken - Refreshes the token; resolves to the new token or null.
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
  let refreshing: Promise<string | null> | null = null

  /** Starts a token refresh, or joins the one in flight. */
  const refreshOnce = (): Promise<string | null> => {
    refreshing ??= refreshAuthToken()
      .catch(() => null)
      .finally(() => {
        refreshing = null
      })
    return refreshing
  }

  return async (url, init) => {
    const response = await fetchImpl(url, withAuth(init, getAuthToken()))
    if (response.status !== UNAUTHORIZED) return response
    const token = await refreshOnce()
    if (!token) return response
    return fetchImpl(url, withAuth(init, token))
  }
}
