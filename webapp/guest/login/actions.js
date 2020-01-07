import axios from 'axios'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { hideAppLoader, initUser, showAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { appModuleUri, guestModules, homeModules } from '@webapp/app/appModules'

export const loginEmailUpdate = 'login/email/update'
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

export const login = (email, password, history) =>
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
      history.push(guestModules.acceptInvitation.path)
    } else {
      dispatch(setLoginError(message))
    }
  })

export const acceptInvitation = (name, password, history) =>
  _createAction(async dispatch => {
    await axios.put(`/api/user/accept-invitation`, {
      name,
      password,
    })
    await dispatch(initUser())
    history.push(appModuleUri(homeModules.dashboard))
  })

export const sendPasswordResetEmail = (email, history) =>
  _createAction(async dispatch => {
    const {
      data: { error },
    } = await axios.post('/auth/reset-password', { email })

    if (error) {
      dispatch(setLoginError(error))
    } else {
      dispatch(showNotification('common.emailSentConfirmation', { email }))
      history.goBack()
    }
  })
