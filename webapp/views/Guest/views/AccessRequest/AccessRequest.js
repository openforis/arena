import './AccessRequest.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'
import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as UserAccessRequestValidator from '@core/user/userAccessRequestValidator'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { useI18n } from '@webapp/store/system'
import * as API from '@webapp/service/api'

const AccessRequest = () => {
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
        dispatch(NotificationActions.notifyError({ key: 'accessRequestView.error', params: { error } }))
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

  const fields = [
    { name: UserAccessRequest.keys.email, required: true },
    { name: `props.${UserAccessRequest.keysProps.firstName}`, required: true },
    { name: `props.${UserAccessRequest.keysProps.lastName}`, required: true },
    { name: `props.${UserAccessRequest.keysProps.institution}` },
    { name: `props.${UserAccessRequest.keysProps.country}` },
    { name: `props.${UserAccessRequest.keysProps.purpose}` },
  ]

  return (
    <div className="access-request">
      <div className="title">{i18n.t('accessRequestView.title')}</div>
      <div className="introduction">{i18n.t('accessRequestView.introduction')}</div>
      <form onSubmit={(event) => event.preventDefault()}>
        {fields.map(({ name }) => {
          const validationFieldName = name.startsWith('props.') ? name.substring(6) : name
          return (
            <FormItem key={name} label={i18n.t(`accessRequestView.fields.${name}`)}>
              <Input
                value={R.path(name.split('.'))(request)}
                onChange={(value) => onFieldValueChange({ name, value })}
                validation={Validation.getFieldValidation(validationFieldName)(validation)}
              />
            </FormItem>
          )
        })}

        <div className="guest__buttons">
          <button type="submit" className="btn" onClick={onSubmit}>
            {i18n.t('accessRequestView.sendRequest')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AccessRequest
