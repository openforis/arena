import axios from 'axios'

import { ServiceErrorActions } from '@webapp/store/system'
import { ApiConstants } from '@webapp/service/api/utils/apiConstants'
import * as AppWebSocket from '@webapp/app/appWebSocket'
import { singleFlight } from '@webapp/app/singleFlight'

const tokenRefreshEndpoint = '/auth/token/refresh'

const loginUrlRegExp = /^\/auth\/login$/
const tokenRefreshUrlRegExp = /^\/auth\/token\/refresh$/

const errorIgnoredUrlRegExps = [
  loginUrlRegExp, // login
  /^\/auth\/user$/, // user (if not logged in or authorized)
  /^\/api\/survey$/, // survey create (errors handled locally)
  /^\/api\/surveyRdb\/\d+\/[\w-]+\/query$/, // data query
  /^\/api\/surveyRdb\/\d+\/[\w-]+\/export\/start$/, // data query export
  /^\/api\/mobile\/survey\/\d+$/, // data import (Arena format)
  /^\/api\/2fa\/device\/[\w-]+\/verify$/, // 2FA device verification
  /^\/api\/survey\/\d+\/record\/[\w-]+\/nodes\/[\w-]+\/file$/, // node file preview (errors handled locally in ImagePreview)
]

const authorizationIgnoredUrlRegExps = [loginUrlRegExp, tokenRefreshUrlRegExp]

const isErrorIgnoredUrlIgnored = (url) => errorIgnoredUrlRegExps.some((ignoredUrlRegExp) => ignoredUrlRegExp.test(url))

const isAuthorizationIgnoredUrl = (url) =>
  authorizationIgnoredUrlRegExps.some((ignoredUrlRegExp) => ignoredUrlRegExp.test(url))

const setAuthorizationHeader = ({ config, authToken }) => {
  config.headers = { ...config.headers, Authorization: `Bearer ${authToken}` }
}

const requestTokenRefresh = async () => {
  try {
    const response = await axios.post(tokenRefreshEndpoint, null, {
      withCredentials: true, // Important if using HttpOnly cookies
    })
    const { authToken } = response.data
    ApiConstants.setAuthToken(authToken)
    AppWebSocket.updateSocketToken(authToken)
    return { authToken }
  } catch (error) {
    return { error }
  }
}

/**
 * Refreshes the Arena auth token (also used by the AI gateway fetch). Concurrent calls (axios 401s and AI
 * fetch 401s) share one in-flight refresh, so every waiting caller settles with the same result.
 * @returns {Promise<{authToken?: string, error?: unknown}>} The new token or the error.
 */
export const refreshAuthToken = singleFlight(requestTokenRefresh)

const handleAuthorizationError = async ({ originalRequest }) => {
  const { authToken, error } = await refreshAuthToken()

  if (authToken) {
    // Retry the original failed request only once: a 401 surviving a token refresh means it wasn't
    // actually caused by an expired Arena token, so retrying again would loop forever.
    originalRequest._retry = true
    setAuthorizationHeader({ config: originalRequest, authToken })
    return axios.request(originalRequest)
  }
  // Log the user out and redirect to the login page
  // window.location.href = '/'

  throw error
}

const createAxiosMiddleware =
  (axiosInstance) =>
  ({ dispatch }) => {
    axiosInstance.interceptors.request.use((config) => {
      const token = ApiConstants.getAuthToken()
      // If a token exists, add it to the Authorization header
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    })
    axiosInstance.interceptors.response.use(null, async (error) => {
      const originalRequest = error.config ?? {}
      const { url } = originalRequest

      // Check for 401 response and ensure it's not the refresh endpoint itself or the login endpoint;
      // skip requests already retried once after a token refresh, to avoid an infinite retry loop
      // when the 401 isn't actually caused by an expired Arena token.
      if (error.response?.status === 401 && !isAuthorizationIgnoredUrl(url) && !originalRequest._retry) {
        return handleAuthorizationError({ originalRequest })
      }
      const errorIgnored = originalRequest.errorHandledLocally || isErrorIgnoredUrlIgnored(url)
      if (!axios.isCancel(error) && url && !errorIgnored) {
        dispatch(ServiceErrorActions.createServiceError({ error }))
      }
      throw error
    })

    return (next) => (action) => next(action)
  }

export default createAxiosMiddleware(axios)
