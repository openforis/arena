import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import type { UserAccessRequest } from '@core/user/userAccessRequest'
import * as UserAccessRequestAcceptValidator from '@core/user/userAccessRequestAcceptValidator'

import * as API from '@webapp/service/api'

import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, LoaderActions, NotificationActions } from '@webapp/store/ui'

import * as ValidationUtils from '@webapp/utils/validationUtils'

export type AccessRequestAccept = {
  accessRequestUuid: string
  email: string
  surveyName: string
  surveyLabel: string
  role: string
  templateUuid?: string | null
}

type UseAcceptRequestPanelParams = {
  userAccessRequest: UserAccessRequest
  onRequestAccepted: () => void
}

export const useAcceptRequestPanel = ({ userAccessRequest, onRequestAccepted }: UseAcceptRequestPanelParams) => {
  const { uuid: accessRequestUuid, email, props: requestProps } = userAccessRequest

  const { templateUuid } = requestProps

  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  const i18n = useI18n()

  const [accessRequestAccept, setAccessRequestAccept] = useState<AccessRequestAccept>({
    accessRequestUuid,
    email,
    surveyName: requestProps.surveyName ?? '',
    surveyLabel: i18n.t('usersAccessRequestView.acceptRequest.surveyLabelInitial'),
    role: AuthGroup.groupNames.surveyManager,
    templateUuid,
  })

  const { role, surveyName } = accessRequestAccept

  const [validation, setValidation] = useState<any>(null)

  const [templateLabel, setTemplateLabel] = useState('')

  // load template label (if template is defined in the access request)
  useEffect(() => {
    const loadTemplateLabel = async () => {
      const templates = await API.fetchSurveyTemplatesPublished()
      const template = templates.find((template: any) => Survey.getUuid(template) === templateUuid)
      setTemplateLabel(Survey.getDefaultLabel(template))
    }
    if (templateUuid) {
      void loadTemplateLabel()
    }
  }, [templateUuid])

  const roleLabelFunction = (r: string): string => i18n.t(`auth:authGroups.${r}.label`)

  const onUpdate = async ({ field, value }: { field: keyof AccessRequestAccept; value: string }) => {
    const accessRequestAcceptUpdated = { ...accessRequestAccept, [field]: value }
    const validationUpdated = await UserAccessRequestAcceptValidator.validateUserAccessRequestAccept({
      accessRequestAccept: accessRequestAcceptUpdated,
    })
    setAccessRequestAccept(accessRequestAcceptUpdated)
    setValidation(validationUpdated)
  }

  const performAccept = async () => {
    dispatch(LoaderActions.showLoader())

    const {
      errorKey,
      errorParams,
      validation: validationServer,
    } = await API.acceptAccessRequest({ accessRequestAccept })

    dispatch(LoaderActions.hideLoader())

    setValidation(validationServer)

    if (errorKey || Validation.isNotValid(validationServer)) {
      const error = errorKey
        ? i18n.t(errorKey, errorParams)
        : ValidationUtils.getValidationFieldMessages(i18n)(validationServer).join('; ')
      dispatch(
        NotificationActions.notifyError({
          key: 'usersAccessRequestView.acceptRequest.error',
          params: { error },
        })
      )
    } else {
      dispatch(
        NotificationActions.notifyInfo({
          key: 'usersAccessRequestView.acceptRequest.requestAcceptedSuccessfully',
          params: { email },
        })
      )
      onRequestAccepted()
    }
  }

  const onSubmit = () => {
    if (Validation.isNotValid(validation)) {
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotContinue' }))
    } else {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'usersAccessRequestView.acceptRequest.confirmAcceptRequestAndCreateSurvey',
          params: { email, role: roleLabelFunction(role), surveyName },
          onOk: performAccept,
        })
      )
    }
  }
  return {
    onUpdate,
    onSubmit,
    accessRequestAccept,
    templateLabel: templateUuid ? templateLabel : i18n.t('guest:accessRequestView.templateNotSelected'),
    validation,
  }
}
