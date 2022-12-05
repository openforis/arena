import axios from 'axios'

import { ServiceErrorActions } from '@webapp/store/system'

const ignoredUrlRegExps = [
  /^\/auth\/login$/, // login
  /^\/api\/surveyRdb\/\d+\/[\w-]+\/query$/, // data query
]

const createAxiosMiddleware =
  (axiosInstance) =>
  ({ dispatch }) => {
    axiosInstance.interceptors.response.use(null, (error) => {
      const url = error?.config?.url
      if (!axios.isCancel(error) && url && !ignoredUrlRegExps.some((urlRegExp) => urlRegExp.test(url))) {
        dispatch(ServiceErrorActions.createServiceError({ error }))
      }
      return Promise.reject(error)
    })

    return (next) => (action) => next(action)
  }

export default createAxiosMiddleware(axios)
