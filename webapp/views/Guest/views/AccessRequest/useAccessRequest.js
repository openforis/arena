import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as ObjectUtils from '@core/objectUtils'
import * as UserAccessRequestValidator from '@core/user/userAccessRequestValidator'
import * as Validation from '@core/validation/validation'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { useI18n } from '@webapp/store/system'
import * as API from '@webapp/service/api'

export const useAccessRequest = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()

  const [request, setRequestState] = useState({})
  const [validation, setValidation] = useState(null)

  const validate = async () => setValidation(await UserAccessRequestValidator.validateUserAccessRequest(request))

  const onFieldValueChange = async ({ name, value }) => {
    setRequestState((reqPrev) => ObjectUtils.setInPath(name.split('.'), value)({ ...reqPrev }))
    await validate()
  }

  const onSubmit = async () => {
    const onSubmitConfirm = async () => {
      const { error, validation: validationServer } = await API.createAccessRequest({ accessRequest: request })
      setValidation(validationServer)

      if (error) {
        dispatch(NotificationActions.notifyError({ key: 'accessRequestView.error', params: { error: i18n.t(error) } }))
      } else {
        dispatch(
          NotificationActions.notifyInfo({ key: 'accessRequestView.requestSent', params: { email: request.email } })
        )
        history.goBack()
      }
    }
    const validationUpdated = await UserAccessRequestValidator.validateUserAccessRequest(request)
    setValidation(validationUpdated)

    if (!Validation.isValid(validationUpdated)) {
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotSave' }))
      return
    }

    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'accessRequestView.sendRequestConfirm',
        onOk: onSubmitConfirm,
      })
    )
  }

  return { request, validation, onFieldValueChange, onSubmit }
}
