import axios from 'axios'
import * as R from 'ramda'

import { ServiceErrorActions } from '@webapp/store/system'

const createAxiosMiddleware = (axiosInstance) => ({ dispatch }) => {
  axiosInstance.interceptors.response.use(null, (error) => {
    const message = R.pathOr(error.message, ['response', 'data', 'error'], error)
    dispatch({ type: ServiceErrorActions.appErrorCreate, error: { ...error, message } })

    return Promise.reject(error)
  })

  return (next) => (action) => next(action)
}

export default createAxiosMiddleware(axios)
