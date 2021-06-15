import axios from 'axios'
import * as R from 'ramda'

import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as User from '@core/user/user'
import * as UserInvite from '@core/user/userInvite'

import { appModuleUri, userModules } from '@webapp/app/appModules'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

export const useOnInviteRepeat = ({ userToUpdate: userToInvite }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  return () => {
    ;(async () => {
      try {
        dispatch(LoaderActions.showLoader())

        const userInvite = UserInvite.newUserInvite(User.getEmail(userToInvite), User.getGroupUuid(userToInvite))
        const userInviteParams = R.assoc('surveyCycleKey', surveyCycleKey)(userInvite)

        const { data } = await axios.post(`/api/survey/${surveyId}/users/inviteRepeat`, userInviteParams)
        const { error } = data
        if (error) {
          dispatch(NotificationActions.notifyError({ key: error }))
        } else {
          dispatch(
            NotificationActions.notifyInfo({
              key: 'emails.userInviteRepeatConfirmation',
              params: { email: UserInvite.getEmail(userInvite) },
            })
          )

          history.push(appModuleUri(userModules.users))
        }
      } finally {
        dispatch(LoaderActions.hideLoader())
      }
    })()
  }
}
