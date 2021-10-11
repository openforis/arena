import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'
import axios from 'axios'
import * as R from 'ramda'

import * as Authorizer from '@core/auth/authorizer'
import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as UserInvite from '@core/user/userInvite'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import { useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'
import { DialogConfirmActions, LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useUser } from '@webapp/store/user'

import { validateUserInvite } from './validate'

const _performInvite =
  ({ dispatch, history, surveyId, surveyCycleKey, userInvite, repeatInvitation }) =>
  async () => {
    try {
      dispatch(LoaderActions.showLoader())

      const userInviteParams = R.pipe(
        R.omit([UserInvite.keys.validation]),
        R.assoc('surveyCycleKey', surveyCycleKey),
        R.assoc('repeatInvitation', repeatInvitation)
      )(userInvite)

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
        history.push(appModuleUri(userModules.usersSurvey))
      }
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }

export const useOnInvite = ({ userInvite, setUserInvite, repeatInvitation = false }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()
  const user = useUser()

  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const groups = Authorizer.getUserGroupsCanAssign({ user, surveyInfo })

  return useCallback(async () => {
    const userInviteValidated = await validateUserInvite(userInvite)

    if (Validation.isObjValid(userInviteValidated)) {
      const groupUuid = UserInvite.getGroupUuid(userInvite)
      const group = groups.find((group) => group.uuid === groupUuid)

      const invite = _performInvite({ dispatch, history, surveyId, surveyCycleKey, userInvite, repeatInvitation })

      if (AuthGroup.isSystemAdminGroup(group)) {
        // ask for a confirmation when user is inviting someone else as system administrator
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'userInviteView.confirmInviteSystemAdmin',
            params: { email: UserInvite.getEmail(userInvite) },
            onOk: invite,
          })
        )
      } else {
        invite()
      }
    } else {
      setUserInvite(userInviteValidated)
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotContinue' }))
    }
  }, [userInvite])
}
