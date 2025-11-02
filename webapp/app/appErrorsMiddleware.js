import axios from 'axios'

import { ServiceErrorActions } from '@webapp/store/system'
import { ApiConstants } from '@webapp/service/api/utils/apiConstants'

const tokenRefreshEndpoint = '/auth/token/refresh'

const ignoredUrlRegExps = [
  /^\/auth\/login$/, // login
  /^\/auth\/user$/, // user (if not logged in or authorized)
  /^\/api\/surveyRdb\/\d+\/[\w-]+\/query$/, // data query
  /^\/api\/surveyRdb\/\d+\/[\w-]+\/export\/start$/, // data query export
  /^\/api\/mobile\/survey\/\d+$/, // data import (Arena format)
]

const isUrlIgnored = (url) => ignoredUrlRegExps.some((ignoredUrlRegExp) => ignoredUrlRegExp.test(url))

let isRefreshingToken = false
let failedRequestsQueue = []

const setAuthorizationHeader = ({ config, authToken }) => {
  config.headers = config.headers || {}
  config.headers.Authorization = `Bearer ${authToken}`
}

const processFailedRequestsQueue = ({ error = null, authToken = null }) => {
  for (const failedRequest of failedRequestsQueue) {
    const { resolve, reject, config } = failedRequest
    if (error) {
      reject(error)
    } else if (authToken) {
      setAuthorizationHeader({ config, authToken })
      resolve(axios.request(config))
    }
  }
  failedRequestsQueue = []
}

const refreshAuthToken = async () => {
  isRefreshingToken = true
  try {
    const response = await axios.post(tokenRefreshEndpoint, null, {
      withCredentials: true, // Important if using HttpOnly cookies
    })
    const { authToken } = response.data
    ApiConstants.setAuthToken(authToken)
    return { authToken }
  } catch (error) {
    return { error }
  } finally {
    isRefreshingToken = false
  }
}

const handleAuthorizationError = async ({ originalRequest }) => {
  if (isRefreshingToken) {
    // Queue the request if a token refresh is already in progress
    return new Promise((resolve, reject) => {
      failedRequestsQueue.push({ resolve, reject, config: originalRequest })
    })
  }

  const { authToken, error } = await refreshAuthToken()

  processFailedRequestsQueue({ authToken, error })

  if (authToken) {
    // Retry the original failed request
    setAuthorizationHeader({ config: originalRequest, authToken })
    return axios.request(originalRequest)
  } else {
    processFailedRequestsQueue({ error }) // Reject all queued requests

    // Log the user out and redirect to the login page
    // window.location.href = '/'

    return Promise.reject(error)
  }
}

const createAxiosMiddleware =
  (axiosInstance) =>
  ({ dispatch }) => {
    axiosInstance.interceptors.request.use(
      (config) => {
        const token = ApiConstants.getAuthToken()
        // If a token exists, add it to the Authorization header
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
    axiosInstance.interceptors.response.use(null, async (error) => {
      const originalRequest = error.config ?? {}
      const { url } = originalRequest

      // Check for 401 response and ensure it's not the refresh endpoint itself
      if (error.response.status === 401 && url !== tokenRefreshEndpoint) {
        return handleAuthorizationError({ originalRequest })
      }
      if (!axios.isCancel(error) && url && !isUrlIgnored(url)) {
        dispatch(ServiceErrorActions.createServiceError({ error }))
      }
      return Promise.reject(error)
    })

    return (next) => (action) => next(action)
  }

export default createAxiosMiddleware(axios)
