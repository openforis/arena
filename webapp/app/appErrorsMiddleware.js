import axios from 'axios'

import { ServiceErrorActions } from '@webapp/store/system'

const ignoredUrls = ['/auth/login']

const createAxiosMiddleware =
  (axiosInstance) =>
  ({ dispatch }) => {
    axiosInstance.interceptors.response.use(null, (error) => {
      if (!axios.isCancel(error) && !ignoredUrls.includes(error?.config?.url)) {
        dispatch(ServiceErrorActions.createServiceError({ error }))
      }
      return Promise.reject(error)
    })

    return (next) => (action) => next(action)
  }

export default createAxiosMiddleware(axios)
