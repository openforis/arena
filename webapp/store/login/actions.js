import axios from 'axios'

import * as Validation from '@core/validation/validation'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'

import { SystemActions } from '@webapp/store/system'

export const loginEmailUpdate = 'login/email/update'
export const loginErrorUpdate = 'login/error'

export const setEmail = (email) => (dispatch) => dispatch({ type: loginEmailUpdate, email })

export const setLoginError = (message) => (dispatch) => dispatch({ type: loginErrorUpdate, message })

const _createAction = (handlerFn) => async (dispatch, getState) => {
  try {
    dispatch(LoaderActions.showLoader())
    dispatch(setLoginError(null))

    await handlerFn(dispatch, getState)
  } catch (error) {
    dispatch(setLoginError(Validation.messageKeys.user[error.code]))
  } finally {
    dispatch(LoaderActions.hideLoader())
  }
}

export const login = (email, password) =>
  _createAction(async (dispatch) => {
    const {
      data: { message, user },
    } = await axios.post('/auth/login', { email, password })

    if (user) {
      dispatch(setEmail(''))
      dispatch(SystemActions.initSystem())
    } else {
      dispatch(setLoginError(message))
    }
  })

export const logout = () => async (dispatch) => {
  dispatch(LoaderActions.showLoader())

  await axios.post('/auth/logout')

  dispatch(SystemActions.resetSystem())
  dispatch(LoaderActions.hideLoader())
}

export const sendPasswordResetEmail = (email, navigate) =>
  _createAction(async (dispatch) => {
    const {
      data: { error },
    } = await axios.post('/auth/reset-password', { email })

    if (error) {
      dispatch(setLoginError(error))
    } else {
      dispatch(NotificationActions.notifyInfo({ key: 'common.emailSentToSelfConfirmation', params: { email } }))
      navigate(-1)
    }
  })
