import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'
import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as UserInvite from '@core/user/userInvite'
import { appModuleUri, userModules } from '@webapp/app/appModules'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'

import { validateUserInvite } from './validate'

export const useOnInvite = ({ userInvite, repeatInvitation = false }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  return () => {
    ;(async () => {
      const userInviteValidated = await validateUserInvite(userInvite)

      if (Validation.isObjValid(userInviteValidated)) {
        try {
          dispatch(LoaderActions.showLoader())

          const userInviteParams = R.pipe(
            R.omit([UserInvite.keys.validation]),
            R.assoc('surveyCycleKey', surveyCycleKey),
            R.assoc('repeatInvitation', repeatInvitation)
          )(userInviteValidated)

          const { data } = await axios.post(`/api/survey/${surveyId}/users/invite`, userInviteParams)
          const { errorKey, errorParams } = data

          if (errorKey) {
            dispatch(NotificationActions.notifyError({ key: errorKey, params: errorParams }))
          } else {
            dispatch(
              NotificationActions.notifyInfo({
                key: 'common.emailSentConfirmation',
                params: { email: UserInvite.getEmail(userInvite) },
              })
            )
            history.push(appModuleUri(userModules.users))
          }
        } finally {
          dispatch(LoaderActions.hideLoader())
        }
      }
    })()
  }
}
