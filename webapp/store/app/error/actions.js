import * as ErrorActionTypes from './actionTypes'

export const throwSystemError = ({ error }) => (dispatch) =>
  dispatch({ type: ErrorActionTypes.APP_ERROR_THROW, payload: { error } })
