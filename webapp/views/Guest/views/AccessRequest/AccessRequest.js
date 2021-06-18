import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import { FormItem, Input } from '@webapp/components/form/Input'

import { DialogConfirmActions } from '@webapp/store/ui'
import { useI18n } from '@webapp/store/system'

const AccessRequest = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()

  const [request, setRequest] = useState({})

  const onSubmit = () => {
    const onSubmitConfirm = () => {}

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
