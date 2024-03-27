import * as R from 'ramda'

export const SERVICE_ERROR_CREATE = 'service/error/create'
export const SERVICE_ERROR_DELETE = 'service/error/delete'

export const closeServiceError = (error) => (dispatch) => dispatch({ type: SERVICE_ERROR_DELETE, error })
export const createServiceError =
  ({ error }) =>
  (dispatch) => {
    const message = R.pathOr(error.message, ['response', 'data', 'error'], error)
    return dispatch({ type: SERVICE_ERROR_CREATE, error: { ...error, message } })
  }
