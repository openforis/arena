import './UserPasswordChange.scss'

import React, { useState } from 'react'

import * as Validation from '@core/validation/validation'
import { UserPasswordChangeForm } from '@core/user/userPasswordChangeForm'
import { UserPasswordChangeFormValidator } from '@core/user/userPasswordChangeFormValidator'

import * as API from '@webapp/service/api'

import { Button, ButtonBack } from '@webapp/components'
import { useNotifyInfo } from '@webapp/components/hooks'
import { UserPasswordSetForm } from './UserPasswordSetForm'

const defaultState = { form: UserPasswordChangeForm.newForm(), validation: {} }

const UserPasswordChange = () => {
  const notifyInfo = useNotifyInfo()

  const [state, setState] = useState(defaultState)
  const { form, validation } = state
  const empty = UserPasswordChangeForm.isEmpty(form)

  const setStateProp = (prop) => async (value) => {
    const formNext = { ...form, [prop]: value }
    const validationNext = await UserPasswordChangeFormValidator.validate(formNext)
    setState({ form: formNext, validation: validationNext })
  }

  const resetState = () => setState(defaultState)

  const onChangePasswordClick = async () => {
    const { validation: validationUpdated } = await API.changeUserPassword({ form })
    if (!validationUpdated) {
      notifyInfo({ key: 'userPasswordChangeView.passwordChangedSuccessfully' })
      resetState()
    } else {
      setState((statePrev) => ({ ...statePrev, validation: validationUpdated }))
    }
  }

  return (
    <div className="user-change-password">
      <UserPasswordSetForm
        form={form}
        onFieldChange={(key) => (value) => setStateProp(key)(value)}
        passwordChange
        validation={validation}
      />

      <div className="button-bar">
        <ButtonBack />

        <Button
          className="btn-primary"
          disabled={Validation.isNotValid(validation) || empty}
          label="userPasswordChangeView.changePassword"
          onClick={onChangePasswordClick}
        />
      </div>
    </div>
  )
}

export default UserPasswordChange
