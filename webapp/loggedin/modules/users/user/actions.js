import axios from 'axios'
import * as R from 'ramda'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as UserValidator from '@core/user/userValidator'
import * as Validation from '@core/validation/validation'

import { showAppLoader, hideAppLoader, setUser } from '@webapp/app/actions'

import * as UserViewState from '@webapp/loggedin/modules/users/user/userViewState'
import * as SurveyState from '@webapp/survey/surveyState'
import { showNotification } from '@webapp/app/appNotification/actions'

import * as AppState from '@webapp/app/appState'
import * as AppNotificationState from '@webapp/app/appNotification/appNotificationState'
import { appModuleUri, userModules } from '@webapp/app/appModules'

export const userUpdate = 'user/update'
export const userProfilePictureUpdate = 'user/profilePicture/update'
export const userStateReset = 'user/reset'

export const resetUserState = () => dispatch => dispatch({ type: userStateReset })

export const fetchUser = userUuid => async (dispatch, getState) => {
  const state = getState()
  const user = AppState.getUser(state)
  const userToUpdate = UserViewState.getUser(state)
  const surveyId = SurveyState.getSurveyId(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const editingSelf = User.isEqual(userToUpdate)(user)

  const { data: userLoaded } = await axios.get(`/api${editingSelf ? '' : `/survey/${surveyId}`}/user/${userUuid}`)

  const authGroup = User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo))(userLoaded)
  const userUpdated = User.assocGroupUuid(AuthGroup.getUuid(authGroup))(userLoaded)

  dispatch({ type: userUpdate, user: userUpdated })
}

const _validateUser = user => async dispatch => {
  const isInvitation = R.pipe(User.getUuid, R.isNil)(user)
  const validation = isInvitation
    ? await UserValidator.validateInvitation(user)
    : await UserValidator.validateUser(user)

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

export const updateUserProfilePicture = profilePicture => async dispatch =>
  dispatch({ type: userProfilePictureUpdate, profilePicture })

export const saveUser = history => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()
  const user = AppState.getUser(state)
  const userToUpdate = UserViewState.getUser(state)
  const profilePicture = UserViewState.getProfilePicture(state)
  const surveyId = SurveyState.getSurveyId(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  const userValidated = await dispatch(_validateUser(userToUpdate))

  if (Validation.isObjValid(userValidated)) {
    const editingSelf = User.isEqual(user)(userToUpdate)
    const isInvitation = R.pipe(User.getUuid, R.isNil)(userToUpdate)
    try {
      if (isInvitation) {
        const userInviteParams = R.pipe(
          R.omit([User.keys.name, User.keys.validation]),
          R.assoc('surveyCycleKey', surveyCycleKey),
        )(userToUpdate)
        await axios.post(`/api/survey/${surveyId}/users/invite`, userInviteParams)
      } else {
        const formData = new FormData()
        formData.append(User.keys.uuid, User.getUuid(userToUpdate))
        formData.append(User.keys.name, User.getName(userToUpdate))
        formData.append(User.keys.email, User.getEmail(userToUpdate))
        formData.append(User.keys.groupUuid, User.getGroupUuid(userToUpdate))
        if (profilePicture) {
          formData.append('file', profilePicture)
        }

        await axios.put(`/api${editingSelf ? '' : `/survey/${surveyId}`}/user/${User.getUuid(userToUpdate)}`, formData)
      }

      // Update user in redux state if self
      if (User.isEqual(user)(userToUpdate)) {
        dispatch(setUser(userToUpdate))
      }

      if (isInvitation) {
        dispatch(
          showNotification('common.emailSentConfirmation', {
            email: User.getEmail(userToUpdate),
          }),
        )
      } else {
        dispatch(
          showNotification('usersView.updateUserConfirmation', {
            name: User.getName(userToUpdate),
          }),
        )
      }

      if (!editingSelf) {
        history.push(appModuleUri(userModules.users))
      }
    } catch (error) {
      dispatch(showNotification('appErrors.generic', { text: error }, AppNotificationState.severity.error))
    }
  }

  dispatch(hideAppLoader())
}

export const removeUser = history => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()
  const lang = AppState.getLang(state)
  const surveyId = SurveyState.getSurveyId(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const userToUpdate = UserViewState.getUser(state)

  try {
    await axios.delete(`/api/survey/${surveyId}/user/${User.getUuid(userToUpdate)}`)

    dispatch(
      showNotification('userView.removeUserConfirmation', {
        user: User.getName(userToUpdate),
        survey: Survey.getLabel(surveyInfo, lang),
      }),
    )
    history.push(appModuleUri(userModules.users))
  } catch (error) {
    dispatch(showNotification('appErrors.generic', { text: error }, AppNotificationState.severity.error))
  }

  dispatch(hideAppLoader())
}
