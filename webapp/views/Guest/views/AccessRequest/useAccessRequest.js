import { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as ObjectUtils from '@core/objectUtils'
import * as UserAccessRequestValidator from '@core/user/userAccessRequestValidator'
import * as Validation from '@core/validation/validation'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

export const useAccessRequest = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()

  const [request, setRequestState] = useState({})
  const [requestSentSuccessfully, setRequestSentSuccessfully] = useState(false)
  const [validation, setValidation] = useState(null)
  const reCaptchaRef = useRef(null)

  const validate = async () => setValidation(await UserAccessRequestValidator.validateUserAccessRequest(request))

  const onFieldValueChange = async ({ name, value }) => {
    setRequestState((reqPrev) => ObjectUtils.setInPath(name.split('.'), value)({ ...reqPrev }))
    await validate()
  }

  const checkFormValid = async () => {
    const validationUpdated = await UserAccessRequestValidator.validateUserAccessRequest(request)
    setValidation(validationUpdated)

    if (!Validation.isValid(validationUpdated)) {
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotSave' }))
      return false
    }

    const reCaptchaToken = reCaptchaRef.current?.getValue()
    if (!reCaptchaToken) {
      dispatch(NotificationActions.notifyWarning({ key: 'accessRequestView.reCaptchaNotAnswered' }))
      return false
    }
    return true
  }

  const onSubmit = async () => {
    const onSubmitConfirm = async () => {
      const reCaptchaToken = reCaptchaRef.current?.getValue()

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
        dispatch(NotificationActions.notifyError({ key: 'accessRequestView.error', params: { error: errorMessage } }))
        reCaptchaRef.current.reset()
      } else {
        setRequestSentSuccessfully(true)
      }
    }

    if (await checkFormValid()) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'accessRequestView.sendRequestConfirm',
          onOk: onSubmitConfirm,
        })
      )
    }
  }

  return { request, requestSentSuccessfully, onFieldValueChange, onSubmit, reCaptchaRef, validation }
}
