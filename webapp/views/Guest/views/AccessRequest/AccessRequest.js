import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { FormItem, Input } from '@webapp/components/form/Input'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { useI18n } from '@webapp/store/system'
import * as API from '@webapp/service/api'

const AccessRequest = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()

  const [request, setRequest] = useState({})

  const onSubmit = () => {
    const onSubmitConfirm = async () => {
      const { error, validation } = await API.createAccessRequest({ accessRequest: request })
      if (error) {
        dispatch(NotificationActions.notifyError({ key: 'accessRequestView.error', params: { error } }))
      } else {
        dispatch(
          NotificationActions.notifyInfo({ key: 'accessRequestView.requestSent', params: { email: request.email } })
        )
        history.goBack()
      }
    }

    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'accessRequestView.sendRequestConfirm',
        onOk: onSubmitConfirm,
      })
    )
  }

  const fields = [
    { name: 'email', required: true },
    { name: 'firstName', required: true },
    { name: 'lastName', required: true },
    { name: 'institution' },
    { name: 'country' },
    { name: 'purpose' },
  ]
  return (
    <>
      <div className="title">{i18n.t('accessRequestView.title')}</div>
      <div className="introduction">{i18n.t('accessRequestView.introduction')}</div>
      {fields.map(({ name }) => (
        <FormItem label={i18n.t(`accessRequestView.fields.${name}`)}>
          <Input value={request[name]} onChange={(value) => setRequest((reqPrev) => ({ ...reqPrev, [name]: value }))} />
        </FormItem>
      ))}

      <div className="guest__buttons">
        <button type="submit" className="btn" onClick={onSubmit}>
          {i18n.t('accessRequestView.sendRequest')}
        </button>
      </div>
    </>
  )
}

export default AccessRequest
