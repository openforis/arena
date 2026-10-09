import axios from 'axios'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'

import { SystemActions } from '@webapp/store/system'
import { appModules, appModuleUri } from '@webapp/app/appModules'
import { ApiConstants } from '@webapp/service/api/utils/apiConstants'
import { AppInfo } from '@core/app/appInfo'
import * as User from '@core/user/user'

import { getConversationStore } from '@webapp/ai/conversations/conversationStore'
import { assistantPanelStore } from '@webapp/components/ai/Assistant/assistantPanelStore'
import * as UserState from '@webapp/store/user/state'

import { ViewState } from './state'

export const loginEmailUpdate = 'login/email/update'
export const loginErrorUpdate = 'login/error'
export const loginViewStateUpdate = 'login/viewState/update'
export const reset = 'login/reset'

export const setEmail = (email) => (dispatch) => dispatch({ type: loginEmailUpdate, email })
export const setLoginError = (message) => (dispatch) => dispatch({ type: loginErrorUpdate, message })
export const setViewState = (viewState) => (dispatch) => dispatch({ type: loginViewStateUpdate, viewState })

const resetState = (dispatch) => dispatch({ type: reset })

const _createAction = (handlerFn) => async (dispatch, getState) => {
  try {
    dispatch(LoaderActions.showLoader())
    dispatch(setLoginError(null))

    await handlerFn(dispatch, getState)
  } catch (error) {
    const messageKey = error?.response?.data?.message || error.toString()
    dispatch(setLoginError(messageKey))
  } finally {
    dispatch(LoaderActions.hideLoader())
  }
}

export const login = (email, password, twoFactorToken) =>
  _createAction(async (dispatch) => {
    const {
      data: { message, user, twoFactorRequired, authToken },
    } = await axios.post('/auth/login', { email, password, twoFactorToken, appInfo: AppInfo.currentAppInfo })
    if (user) {
      ApiConstants.setAuthToken(authToken)
      dispatch(resetState)
      dispatch(SystemActions.initSystem())
    } else if (twoFactorRequired) {
      dispatch(setViewState(ViewState.ask2FAToken))
    } else {
      dispatch(setLoginError(message))
    }
  })

/**
 * Deletes the user's assistant conversations from this browser and resets the panel.
 * @param {string} userUuid - User uuid.
 * @returns {Promise<void>} - Resolves when done (storage errors are ignored: nothing to clear).
 */
const clearAssistantData = async (userUuid) => {
  assistantPanelStore.reset()
  try {
    const store = await getConversationStore()
    await store.clearUser(userUuid)
  } catch {
    // storage blocked or unavailable: no conversation was kept
  }
}

export const logout =
  ({ navigate }) =>
  async (dispatch, getState) => {
    const userUuid = User.getUuid(UserState.getUser(getState()))
    dispatch(LoaderActions.showLoader())

    await axios.post('/auth/logout')

    ApiConstants.setAuthToken(null)
    await clearAssistantData(userUuid)
    dispatch(SystemActions.resetSystem())
    dispatch(LoaderActions.hideLoader())

    // navigate to home page
    navigate(appModuleUri(appModules.home))
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
