import * as actionTypes from './actionTypes'

export const initUser = (user) => (dispatch) =>
  dispatch({
    type: actionTypes.USER_INIT,
    payload: user,
  })

export const updateUser =
  ({ prop, value }) =>
  (dispatch) =>
    dispatch({
      type: actionTypes.USER_UPDATE,
      payload: { [prop]: value },
    })

export const updateUserTitle = (userWithTitle) => (dispatch) =>
  dispatch({
    type: actionTypes.USER_UPDATE,
    payload: { ...userWithTitle },
  })

export const updateError = (error) => (dispatch) =>
  dispatch({
    type: actionTypes.ERROR_UPDATE,
    payload: { error },
  })
