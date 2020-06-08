import axios from 'axios'
import * as R from 'ramda'

import * as UserInvite from '@core/user/userInvite'
import * as UserValidator from '@core/user/userValidator'
import * as Validation from '@core/validation/validation'

import { appModuleUri, userModules } from '@webapp/app/appModules'

import { SurveyState } from '@webapp/store/survey'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'

import * as UserInviteViewState from './userInviteViewState'

export const userInviteUpdate = 'user/invite/update'
export const userInviteStateReset = 'user/invite/reset'

export const resetUserInviteState = () => (dispatch) => dispatch({ type: userInviteStateReset })

const _validateUserInvite = (userInvite) => async (dispatch) => {
  const validation = await UserValidator.validateInvitation(userInvite)
  const userInviteValidated = UserInvite.assocValidation(validation)(userInvite)
  dispatch({ type: userInviteUpdate, userInvite: userInviteValidated })
  return userInviteValidated
}

export const updateUserInviteProp = (key, value) => (dispatch, getState) => {
  const state = getState()
  const userInvite = UserInviteViewState.getUserInvite(state)

  const userInviteUpdated = UserInvite.assocProp(key, value)(userInvite)

  dispatch(_validateUserInvite(userInviteUpdated))
}

export const inviteUser = (history) => async (dispatch, getState) => {
  const state = getState()
  const userInvite = UserInviteViewState.getUserInvite(state)
  const surveyId = SurveyState.getSurveyId(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  const userInviteValidated = await dispatch(_validateUserInvite(userInvite))

  if (Validation.isObjValid(userInviteValidated)) {
    try {
      dispatch(LoaderActions.showLoader())

      const userInviteParams = R.pipe(
        R.omit([UserInvite.keys.validation]),
        R.assoc('surveyCycleKey', surveyCycleKey)
      )(userInviteValidated)
      await axios.post(`/api/survey/${surveyId}/users/invite`, userInviteParams)

      dispatch(
        NotificationActions.notifyInfo({
          key: 'common.emailSentConfirmation',
          params: { email: UserInvite.getEmail(userInvite) },
        })
      )

      history.push(appModuleUri(userModules.users))
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }
}
