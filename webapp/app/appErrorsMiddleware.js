import axios from 'axios'

import { ServiceErrorActions } from '@webapp/store/system'

const tokenRefreshEndpoint = '/auth/token/refresh'

const ignoredUrlRegExps = [
  /^\/auth\/login$/, // login
  /^\/auth\/user$/, // user (if not logged in or authorized)
  /^\/api\/surveyRdb\/\d+\/[\w-]+\/query$/, // data query
  /^\/api\/surveyRdb\/\d+\/[\w-]+\/export\/start$/, // data query export
  /^\/api\/mobile\/survey\/\d+$/, // data import (Arena format)
]

let isRefreshingToken = false
let failedQueue = []

// Function to process the queue of failed requests once the token is refreshed
const processQueue = (error = null, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      // Update the access token for the retried request
      prom.config.headers = prom.config.headers || {}
      prom.config.headers.Authorization = `Bearer ${token}`
      prom.resolve(axios.request(prom.config))
    }
  })
  failedQueue = []
}

const handleAuthorizationError = async ({ originalRequest }) => {
  if (isRefreshingToken) {
    // Queue the request if a token refresh is already in progress
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject, config: originalRequest })
    })
  }

  isRefreshingToken = true

  try {
    // --- 🔑 Token Refresh Request ---
    // This endpoint should be set up to use the HttpOnly Refresh Token cookie
    const response = await axios.post(tokenRefreshEndpoint, null, {
      // baseURL: 'https://api.yourdomain.com', // Use the base URL
      withCredentials: true, // Important if using HttpOnly cookies
    })

    const newAccessToken = response.data.accessToken

    // Update the in-memory token (e.g., setAccessTokenInMemory(newAccessToken))
    // The new refresh token would be set via HttpOnly cookie in the response

    // --- ✅ Success: Retry Original Requests ---
    isRefreshingToken = false
    processQueue(null, newAccessToken)

    // Retry the original failed request
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
    return axios.request(originalRequest)
  } catch (refreshError) {
    // --- ❌ Failure: Redirect to Login ---
    isRefreshingToken = false
    processQueue(refreshError) // Reject all queued requests

    // Log the user out and redirect to the login page
    // e.g., window.location.href = '/login';

    return Promise.reject(refreshError)
  }
}

const createAxiosMiddleware =
  (axiosInstance) =>
  ({ dispatch }) => {
    axiosInstance.interceptors.response.use(null, async (error) => {
      const originalRequest = error.config ?? {}
      const { url } = originalRequest

      // Check for 401 response and ensure it's not the refresh endpoint itself
      if (error.response.status === 401 && url !== tokenRefreshEndpoint) {
        return handleAuthorizationError({ originalRequest })
      }
      if (!axios.isCancel(error) && url && !ignoredUrlRegExps.some((urlRegExp) => urlRegExp.test(url))) {
        dispatch(ServiceErrorActions.createServiceError({ error }))
      }
      return Promise.reject(error)
    })

    return (next) => (action) => next(action)
  }

export default createAxiosMiddleware(axios)
