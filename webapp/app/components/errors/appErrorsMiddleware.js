import axios from 'axios'

import { appErrorCreate } from '../../actions'

const createAxiosMiddleware = (axios) => ({ dispatch, getState }) => {

  axios.interceptors.response.use(null, (error) => {
    dispatch({type: appErrorCreate, error: {...error, message: error.message}})
  })

  return (next) => (action) => next(action)
}

export default createAxiosMiddleware(axios)