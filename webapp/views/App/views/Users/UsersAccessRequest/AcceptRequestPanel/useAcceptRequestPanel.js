import { useState } from 'react'
import { useDispatch } from 'react-redux'

import * as AuthGroup from '@core/auth/authGroup'
import * as Validation from '@core/validation/validation'
import * as UserAccessRequestAcceptValidator from '@core/user/userAccessRequestAcceptValidator'

import * as API from '@webapp/service/api'

import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

import * as ValidationUtils from '@webapp/utils/validationUtils'

export const useAcceptRequestPanel = (props) => {
  const { userAccessRequest } = props
  const { uuid: accessRequestUuid, email, props: requestProps } = userAccessRequest

  const dispatch = useDispatch()
  const i18n = useI18n()

  const [accessRequestAccept, setAccessRequestAccept] = useState({
    accessRequestUuid,
    email,
    surveyName: requestProps.surveyName,
    surveyLabel: i18n.t('usersAccessRequestView.acceptRequest.surveyLabelInitial'),
    role: AuthGroup.groupNames.surveyManager,
  })

  const { role, surveyName } = accessRequestAccept

  const [validation, setValidation] = useState(null)

  const roleLabelFunction = (r) => i18n.t(`authGroups.${r}.label`)

  const onUpdate = async ({ field, value }) => {
    const accessRequestAcceptUpdated = { ...accessRequestAccept, [field]: value }
    const validationUpdated = await UserAccessRequestAcceptValidator.validateUserAccessRequestAccept({
      accessRequestAccept: accessRequestAcceptUpdated,
    })
    setAccessRequestAccept(accessRequestAcceptUpdated)
    setValidation(validationUpdated)
  }

  const onSubmit = () => {
    if (Validation.isNotValid(validation)) {
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotContinue' }))
    } else {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'usersAccessRequestView.acceptRequest.confirmAcceptRequestAndCreateSurvey',
          params: { email, role: roleLabelFunction(role), surveyName },
          onOk: async () => {
            const {
              errorKey,
              errorParams,
              validation: validationServer,
              userInvited,
              survey,
            } = await API.acceptAccessRequest({ accessRequestAccept })

            setValidation(validationServer)

            if (errorKey) {
              dispatch(
                NotificationActions.notifyError({
                  key: 'usersAccessRequestView.acceptRequest.error',
                  params: { error: i18n.t(errorKey, errorParams) },
                })
              )
            } else if (Validation.isNotValid(validationServer)) {
              const error = ValidationUtils.getValidationFieldMessages(i18n)(validationServer).join('; ')
              dispatch(
                NotificationActions.notifyError({
                  key: 'usersAccessRequestView.acceptRequest.error',
                  params: { error },
                })
              )
            } else {
              dispatch(NotificationActions.notifyInfo({ key: 'common.ok' }))
            }
          },
        })
      )
    }
  }
  return { i18n, roleLabelFunction, onUpdate, onSubmit, accessRequestAccept, validation }
}
