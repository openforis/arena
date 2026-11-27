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
  // errors are shown only for the fields already edited, or for all of them once the form is submitted
  const [editedFieldNames, setEditedFieldNames] = useState<Set<string>>(() => new Set())
  const [submitted, setSubmitted] = useState(false)
  // latest request: the validation must use it, not the one of the last render
  const requestRef = useRef<Record<string, any>>({})
  const reCaptchaRef = useRef(null)

  const getRecaptchaToken = () => reCaptchaRef.current?.getValue()

  const onFieldValueChange = async ({ name, value }) => {
    const requestPrev = requestRef.current
    // copy props too: setInPath updates the nested objects in place
    const requestUpdated = ObjectUtils.setInPath(
      name.split('.'),
      value
    )({
      ...requestPrev,
      props: { ...requestPrev.props },
    })
    requestRef.current = requestUpdated
    setRequest(requestUpdated)
    setEditedFieldNames((namesPrev) => (namesPrev.has(name) ? namesPrev : new Set(namesPrev).add(name)))
    const validationUpdated = await UserAccessRequestValidator.validateUserAccessRequest(requestUpdated)
    // ignore the result if the request has changed in the meantime
    if (requestRef.current === requestUpdated) {
      setValidation(validationUpdated)
    }
  }

  const isFieldValidationVisible = (name: string) => submitted || editedFieldNames.has(name)

  const checkFormValid = async () => {
    setSubmitted(true)
    const validationUpdated = await UserAccessRequestValidator.validateUserAccessRequest(requestRef.current)
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
        accessRequest: { ...requestRef.current, reCaptchaToken },
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

  return {
    isFieldValidationVisible,
    request,
    requestSentSuccessfully,
    onFieldValueChange,
    onSubmit,
    reCaptchaRef,
    validation,
  }
}
