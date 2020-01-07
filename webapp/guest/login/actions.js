import axios from 'axios'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import * as LoginState from './loginState'
import * as AppState from '@webapp/app/appState'
import { hideAppLoader, initUser, showAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'

export const loginEmailUpdate = 'login/email/update'
export const loginUserActionUpdate = 'login/userAction/update'
export const loginErrorUpdate = 'login/error'

export const setEmail = email => dispatch => dispatch({ type: loginEmailUpdate, email })

export const setLoginError = message => dispatch => dispatch({ type: loginErrorUpdate, message })

const _createAction = handlerFn => async (dispatch, getState) => {
  try {
    dispatch(showAppLoader())
    dispatch(setLoginError(null))

    await handlerFn(dispatch, getState)
  } catch (error) {
    dispatch(setLoginError(Validation.messageKeys.user[error.code]))
  } finally {
    dispatch(hideAppLoader())
  }
}

export const login = (email, password) =>
  _createAction(async (dispatch, getState) => {
    const {
      data: { message, user },
    } = await axios.post('/auth/login', { email, password })

    if (user && User.hasAccepted(user)) {
      dispatch(setEmail(''))
      dispatch(initUser())
    } else if (
      User.getStatus(user) === User.userStatus.INVITED ||
      message === Validation.messageKeys.user.passwordChangeRequired
    ) {
      dispatch({
        type: loginUserActionUpdate,
        action: LoginState.userActions.setNewPassword,
      })
    } else {
      const i18n = AppState.getI18n(getState())
      dispatch(setLoginError(i18n.t(message)))
    }
  })

export const acceptInvitation = (name, password) =>
  _createAction(async dispatch => {
    await axios.put(`/api/user/accept-invitation`, {
      name,
      password,
    })
    dispatch(initUser())
  })

export const sendPasswordResetEmail = (email, history) =>
  _createAction(async dispatch => {
    const {
      data: { errorMessage },
    } = await axios.post('/auth/reset-password', { email })

    if (errorMessage) {
      dispatch(setLoginError(errorMessage))
    } else {
      dispatch(showNotification('common.emailSentConfirmation', { email }))
      history.goBack()
    }
  })
