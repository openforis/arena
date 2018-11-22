import axios from 'axios'
import * as R from 'ramda'

import { appErrorCreate } from './actions'

const createAxiosMiddleware = (axios) => ({ dispatch, getState }) => {

  axios.interceptors.response.use(null, (error) => {
    const message = R.path(['response', 'data', 'error'], error) || error.message
    dispatch({type: appErrorCreate, error: {...error, message}})

    return Promise.reject(error);
  })

  return (next) => (action) => next(action)
}

export default createAxiosMiddleware(axios)