import axios from 'axios'

import { ServiceErrorActions } from '@webapp/store/system'

const createAxiosMiddleware = (axiosInstance) => ({ dispatch }) => {
  axiosInstance.interceptors.response.use(null, (error) => {
    if (!axios.isCancel(error)) {
      dispatch(ServiceErrorActions.createServiceError({ error }))
    }
    return Promise.reject(error)
  })

  return (next) => (action) => next(action)
}

export default createAxiosMiddleware(axios)
