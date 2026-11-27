import { useRef, useState } from 'react'

import * as ObjectUtils from '@core/objectUtils'
import * as ProcessUtils from '@core/processUtils'
import * as UserAccessRequestValidator from '@core/user/userAccessRequestValidator'
import * as Validation from '@core/validation/validation'
import * as API from '@webapp/service/api'
import { useAppDispatch } from '@webapp/store'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

import { getAccessRequestTexts } from './accessRequestTexts'

export const useAccessRequest = () => {
  const dispatch = useAppDispatch()
  const i18n = useI18n()

  const [request, setRequest] = useState<Record<string, any>>({})
  const [requestSentSuccessfully, setRequestSentSuccessfully] = useState(false)
  const [validation, setValidation] = useState(null)
  const reCaptchaRef = useRef(null)

  const getRecaptchaToken = () => reCaptchaRef.current?.getValue()

  const validate = async () => setValidation(await UserAccessRequestValidator.validateUserAccessRequest(request))

  const onFieldValueChange = async ({ name, value }) => {
    setRequest((reqPrev) => ObjectUtils.setInPath(name.split('.'), value)({ ...reqPrev }))
    await validate()
  }

  const checkFormValid = async () => {
    const validationUpdated = await UserAccessRequestValidator.validateUserAccessRequest(request)
    setValidation(validationUpdated)

    if (!Validation.isValid(validationUpdated)) {
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotSave' }))
      return false
    }

    if (ProcessUtils.ENV.reCaptchaEnabled) {
      if (!getRecaptchaToken()) {
        dispatch(NotificationActions.notifyWarning({ key: 'guest:accessRequestView.reCaptchaNotAnswered' }))
        return false
      }
    }
    return true
  }

  const onSubmit = async () => {
    const onSubmitConfirm = async () => {
      const reCaptchaToken = getRecaptchaToken()

      const {
        error,
        errorParams,
        validation: validationServer,
      } = await API.createAccessRequest({
        accessRequest: { ...request, reCaptchaToken },
      })
      setValidation(validationServer)

      if (error) {
        const errorMessage = i18n.t(error, errorParams)
        dispatch(
          NotificationActions.notifyError({ key: getAccessRequestTexts().error, params: { error: errorMessage } })
        )
        reCaptchaRef.current?.reset()
      } else {
        setRequestSentSuccessfully(true)
      }
    }

    if (await checkFormValid()) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: getAccessRequestTexts().submitConfirm,
          onOk: onSubmitConfirm,
        })
      )
    }
  }

  return { request, requestSentSuccessfully, onFieldValueChange, onSubmit, reCaptchaRef, validation }
}
