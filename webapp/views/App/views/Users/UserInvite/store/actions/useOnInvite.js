import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import axios from 'axios'
import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as Authorizer from '@core/auth/authorizer'
import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as UserInvite from '@core/user/userGroupInvitation'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'
import { DialogConfirmActions, LoaderActions, NotificationActions, NotificationState } from '@webapp/store/ui'
import { useUser } from '@webapp/store/user'

import { validateUserInvite } from './validate'

// builds one notification message out of the same text blocks used elsewhere (invited/skipped/invalid),
// so the user only ever sees a single notification for the outcome of an invite, however many addresses it covers
const _notifyInvitationResult = ({ dispatch, i18n, invitedEmails, skippedEmails, invalidEmails }) => {
  const hasSkippedEmails = !Objects.isEmpty(skippedEmails)
  const hasInvalidEmails = !Objects.isEmpty(invalidEmails)
  const hasIssues = hasSkippedEmails || hasInvalidEmails

  const messageParts = []
  if (invitedEmails.length > 0) {
    messageParts.push(i18n.t('common.emailSentConfirmation', { email: invitedEmails.join(', ') }))
  }
  if (hasSkippedEmails) {
    messageParts.push(
      i18n.t('userInviteView.skippedEmailsNotice', {
        skppedEmailsCount: skippedEmails.length,
        skippedEmails: skippedEmails.join(', '),
      })
    )
  }
  if (hasInvalidEmails) {
    messageParts.push(
      i18n.t('userInviteView.invalidEmailsWarning', {
        count: invalidEmails.length,
        emails: invalidEmails.join(', '),
      })
    )
  }

  dispatch(
    NotificationActions.showNotification({
      text: messageParts.join('\n\n'),
      severity: hasIssues ? NotificationState.severityType.warning : NotificationState.severityType.info,
      timeout: hasIssues ? 0 : 10000,
    })
  )
}

const _performInvite =
  ({ dispatch, i18n, navigate, setUserInvite, surveyId, surveyCycleKey, userInvite, repeatInvitation }) =>
  async () => {
    try {
      dispatch(LoaderActions.showLoader())

      const userInviteParams = R.pipe(
        R.omit([UserInvite.keys.validation]),
        R.assoc('surveyCycleKey', surveyCycleKey),
        R.assoc('repeatInvitation', repeatInvitation)
      )(userInvite)

      const { data } = await axios.post(`/api/survey/${surveyId}/users/invite`, userInviteParams)
      const { errorKey, errorParams, skippedEmails = [], invalidEmails = [] } = data

      const emails = UserInvite.getEmails(userInvite)
      const invitedEmails = emails.filter((email) => !skippedEmails.includes(email) && !invalidEmails.includes(email))

      if (errorKey) {
        dispatch(NotificationActions.notifyError({ key: errorKey, params: errorParams }))
      } else if (invitedEmails.length === 0 && invalidEmails.length === 0) {
        dispatch(
          NotificationActions.notifyError({ key: 'appErrors:userHasRole', params: { count: skippedEmails.length } })
        )
      } else {
        _notifyInvitationResult({ dispatch, i18n, invitedEmails, skippedEmails, invalidEmails })

        if (invalidEmails.length > 0) {
          // keep only the invalid addresses in the form, so the user can fix or remove them and retry
          const userInviteWithInvalidEmailsOnly = UserInvite.assocProp(
            UserInvite.keys.emails,
            invalidEmails
          )(userInvite)
          setUserInvite(await validateUserInvite(userInviteWithInvalidEmailsOnly))
        } else {
          navigate(appModuleUri(userModules.usersSurvey))
        }
      }
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }

export const useOnInvite = ({ userInvite, setUserInvite, repeatInvitation = false }) => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const navigate = useNavigate()
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

      const invite = _performInvite({
        dispatch,
        i18n,
        navigate,
        setUserInvite,
        surveyId,
        surveyCycleKey,
        userInvite,
        repeatInvitation,
      })

      if (AuthGroup.isSystemAdminGroup(group)) {
        // ask for a confirmation when user is inviting someone else as system administrator
        const emails = UserInvite.getEmails(userInvite)
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'userInviteView.confirmInviteSystemAdmin',
            params: { email: UserInvite.getEmailsJoint(userInvite), count: emails.length },
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
  }, [dispatch, groups, i18n, navigate, repeatInvitation, setUserInvite, surveyCycleKey, surveyId, userInvite])
}
