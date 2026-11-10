import { useCallback } from 'react'
import axios from 'axios'

import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as User from '@core/user/user'
import * as UserInvite from '@core/user/userGroupInvitation'

import { appModuleUri, userModules } from '@webapp/app/appModules'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useSurveyUuid } from '@webapp/store/survey/hooks'

export const useOnInviteRepeat = ({ userToInvite, hasToNavigate = true }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const surveyId = useSurveyId()
  const surveyUuid = useSurveyUuid()
  const surveyCycleKey = useSurveyCycleKey()

  return useCallback(
    async (e) => {
      try {
        e.stopPropagation()
        dispatch(LoaderActions.showLoader())

        // the server accepts only the groups of the current survey (or global ones)
        const authGroup = User.getAuthGroupBySurveyUuid({ surveyUuid, defaultToMainGroup: true })(userToInvite)

        const userInvite = UserInvite.newUserGroupInvitation(User.getEmail(userToInvite), authGroup.uuid)
        const userInviteParams = { ...userInvite, surveyCycleKey, repeatInvitation: true }

        const { data } = await axios.post(`/api/survey/${surveyId}/users/invite`, userInviteParams)
        const { errorKey, errorParams } = data

        if (errorKey) {
          dispatch(NotificationActions.notifyError({ key: errorKey, params: errorParams }))
        } else {
          dispatch(
            NotificationActions.notifyInfo({
              key: 'emails:userInviteRepeatConfirmation',
              params: { email: UserInvite.getEmail(userInvite) },
            })
          )

          if (hasToNavigate) {
            navigate(appModuleUri(userModules.usersSurvey))
          }
        }
      } finally {
        dispatch(LoaderActions.hideLoader())
      }
    },
    [dispatch, hasToNavigate, navigate, surveyCycleKey, surveyId, surveyUuid, userToInvite]
  )
}
