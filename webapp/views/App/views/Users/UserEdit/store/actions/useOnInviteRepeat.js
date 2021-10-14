import { useCallback } from 'react'
import axios from 'axios'

import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as User from '@core/user/user'
import * as UserInvite from '@core/user/userInvite'

import { appModuleUri, userModules } from '@webapp/app/appModules'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

export const useOnInviteRepeat = ({ userToInvite, hasToNavigate = true}) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  return useCallback(async (e) => {
    try {
      e.stopPropagation()
      dispatch(LoaderActions.showLoader())

      const authGroups = User.getAuthGroups(userToInvite)
      // authGroups is never empty when repeating an invitation
      const authGroup = authGroups[0]

      const userInvite = UserInvite.newUserInvite(User.getEmail(userToInvite), authGroup.uuid)
      const userInviteParams = { ...userInvite, surveyCycleKey, repeatInvitation: true }

      const { data } = await axios.post(`/api/survey/${surveyId}/users/invite`, userInviteParams)
      const { errorKey, errorParams } = data

      if (errorKey) {
        dispatch(NotificationActions.notifyError({ key: errorKey, params: errorParams }))
      } else {
        dispatch(
          NotificationActions.notifyInfo({
            key: 'emails.userInviteRepeatConfirmation',
            params: { email: UserInvite.getEmail(userInvite) },
          })
        )

        if(hasToNavigate){
          history.push(appModuleUri(userModules.usersSurvey))
        }
      }
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }, [dispatch, history, surveyCycleKey, userToInvite])
}
