import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as UserAccessRequestAcceptValidator from '@core/user/userAccessRequestAcceptValidator'

import * as API from '@webapp/service/api'

import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, LoaderActions, NotificationActions } from '@webapp/store/ui'

import * as ValidationUtils from '@webapp/utils/validationUtils'

export const useAcceptRequestPanel = (props) => {
  const { userAccessRequest, onRequestAccepted } = props
  const { uuid: accessRequestUuid, email, props: requestProps } = userAccessRequest

  const { templateUuid } = requestProps

  const dispatch = useDispatch()
  const i18n = useI18n()

  const [accessRequestAccept, setAccessRequestAccept] = useState({
    accessRequestUuid,
    email,
    surveyName: requestProps.surveyName,
    surveyLabel: i18n.t('usersAccessRequestView.acceptRequest.surveyLabelInitial'),
    role: AuthGroup.groupNames.surveyManager,
    templateUuid,
  })

  const { role, surveyName } = accessRequestAccept

  const [validation, setValidation] = useState(null)

  const [templateLabel, setTemplateLabel] = useState('')

  // load template label (if template is defined in the access request)
  useEffect(() => {
    const loadTemplateLabel = async () => {
      const templates = await API.fetchSurveyTemplatesPublished()
      const template = templates.find((template) => Survey.getUuid(template) === templateUuid)
      setTemplateLabel(Survey.getDefaultLabel(template))
    }
    if (templateUuid) {
      loadTemplateLabel()
    } else {
      setTemplateLabel(i18n.t('accessRequestView.templateNotSelected'))
    }
  }, [templateUuid])

  const roleLabelFunction = (r) => i18n.t(`authGroups.${r}.label`)

  const onUpdate = async ({ field, value }) => {
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
  return { i18n, roleLabelFunction, onUpdate, onSubmit, accessRequestAccept, templateLabel, validation }
}
