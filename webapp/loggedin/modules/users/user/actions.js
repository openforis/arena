import axios from 'axios'
import * as R from 'ramda'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as UserInvite from '@core/user/userInvite'
import * as UserValidator from '@core/user/userValidator'
import * as Validation from '@core/validation/validation'

import { appModuleUri, userModules } from '@webapp/app/appModules'

import { UserState, UserActions } from '@webapp/store/user'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'
import * as UserViewState from '@webapp/loggedin/modules/users/user/userViewState'

import { I18nState } from '@webapp/store/system'

export const userUpdate = 'user/update'
export const userProfilePictureUpdate = 'user/profilePicture/update'
export const userStateReset = 'user/reset'

export const resetUserState = () => (dispatch) => dispatch({ type: userStateReset })

export const fetchUser = (userUuid) => async (dispatch, getState) => {
  const state = getState()
  const user = UserState.getUser(state)
  const surveyId = SurveyState.getSurveyId(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const editingSelf = User.getUuid(user) === userUuid

  const { data: userLoaded } = await axios.get(`/api${editingSelf ? '' : `/survey/${surveyId}`}/user/${userUuid}`)

  const authGroup = User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo))(userLoaded)
  const userUpdated = User.assocGroupUuid(AuthGroup.getUuid(authGroup))(userLoaded)

  dispatch({ type: userUpdate, user: userUpdated })
}

const _validateUser = (user) => async (dispatch) => {
  const validation = await UserValidator.validateUser(user)
  const userValidated = User.assocValidation(validation)(user)
  dispatch({ type: userUpdate, user: userValidated })
  return userValidated
}

export const updateUserProp = (key, value) => (dispatch, getState) => {
  const state = getState()
  const userToUpdate = UserViewState.getUser(state)

  const userUpdated = User.assocProp(key, value)(userToUpdate)

  dispatch(_validateUser(userUpdated))
}

export const updateUserProfilePicture = (profilePicture) => async (dispatch) =>
  dispatch({ type: userProfilePictureUpdate, profilePicture })

export const saveUser = (history) => async (dispatch, getState) => {
  const state = getState()
  const user = UserState.getUser(state)
  const userToUpdate = UserViewState.getUser(state)
  const profilePicture = UserViewState.getProfilePicture(state)
  const surveyId = SurveyState.getSurveyId(state)

  const userValidated = await dispatch(_validateUser(userToUpdate))

  if (Validation.isObjValid(userValidated)) {
    const editingSelf = User.isEqual(user)(userToUpdate)
    try {
      dispatch(LoaderActions.showLoader())

      const formData = new FormData()
      formData.append(User.keys.uuid, User.getUuid(userToUpdate))
      formData.append(User.keys.name, User.getName(userToUpdate))
      formData.append(User.keys.email, User.getEmail(userToUpdate))
      formData.append(User.keys.groupUuid, User.getGroupUuid(userToUpdate))
      if (profilePicture) {
        formData.append('file', profilePicture)
      }

      await axios.put(`/api${editingSelf ? '' : `/survey/${surveyId}`}/user/${User.getUuid(userToUpdate)}`, formData)

      // Update user in redux state if self
      if (User.isEqual(user)(userToUpdate)) {
        dispatch(UserActions.setUser({ user: userToUpdate }))
      }

      dispatch(
        NotificationActions.notifyInfo({
          key: 'usersView.updateUserConfirmation',
          params: { name: User.getName(userToUpdate) },
        })
      )

      if (!editingSelf) {
        history.push(appModuleUri(userModules.users))
      }
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }
}

export const removeUser = (history) => async (dispatch, getState) => {
  const state = getState()
  const lang = I18nState.getLang(state)
  const surveyId = SurveyState.getSurveyId(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const userToUpdate = UserViewState.getUser(state)

  try {
    dispatch(LoaderActions.showLoader())

    await axios.delete(`/api/survey/${surveyId}/user/${User.getUuid(userToUpdate)}`)

    dispatch(
      NotificationActions.notifyInfo({
        key: 'userView.removeUserConfirmation',
        params: {
          user: User.getName(userToUpdate),
          survey: Survey.getLabel(surveyInfo, lang),
        },
      })
    )
    history.push(appModuleUri(userModules.users))
  } finally {
    dispatch(LoaderActions.hideLoader())
  }
}

export const inviteUserRepeat = (history) => async (dispatch, getState) => {
  const state = getState()
  const userToInvite = UserViewState.getUser(state)
  const surveyId = SurveyState.getSurveyId(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  try {
    dispatch(LoaderActions.showLoader())

    const userInvite = UserInvite.newUserInvite(User.getEmail(userToInvite), User.getGroupUuid(userToInvite))
    const userInviteParams = R.assoc('surveyCycleKey', surveyCycleKey)(userInvite)

    await axios.post(`/api/survey/${surveyId}/users/inviteRepeat`, userInviteParams)

    dispatch(
      NotificationActions.notifyInfo({
        key: 'emails.userInviteRepeatConfirmation',
        params: { email: UserInvite.getEmail(userInvite) },
      })
    )

    history.push(appModuleUri(userModules.users))
  } finally {
    dispatch(LoaderActions.hideLoader())
  }
}
