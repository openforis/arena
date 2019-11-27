import axios from 'axios'
import * as R from 'ramda'

import {appErrorCreate} from './appErrors/actions'

const createAxiosMiddleware = axios => ({dispatch, getState}) => {
  axios.interceptors.response.use(null, error => {
    const message = R.pathOr(error.message, ['response', 'data', 'error'], error)
    dispatch({type: appErrorCreate, error: {...error, message}})

    return Promise.reject(error)
  })

  return next => action => next(action)
}

export default createAxiosMiddleware(axios)
