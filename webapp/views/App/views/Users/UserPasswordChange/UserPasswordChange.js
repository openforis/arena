import './UserPasswordChange.scss'

import React, { useState } from 'react'

import * as Validation from '@core/validation/validation'
import { UserPasswordChangeForm } from '@core/user/userPasswordChangeForm'
import { UserPasswordChangeFormValidator } from '@core/user/userPasswordChangeFormValidator'

import * as API from '@webapp/service/api'

import { useI18n } from '@webapp/store/system'

import { FormItem, Input } from '@webapp/components/form/Input'
import { Button } from '@webapp/components'
import { useNotifyInfo } from '@webapp/components/hooks'

const defaultState = { form: UserPasswordChangeForm.newForm(), validation: {} }

const UserPasswordChange = () => {
  const i18n = useI18n()
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
      {Object.values(UserPasswordChangeForm.keys).map((key) => (
        <FormItem key={key} label={i18n.t(`userPasswordChangeView.${key}`)}>
          <Input
            type="password"
            value={form[key]}
            validation={Validation.getFieldValidation(key)(validation)}
            onChange={setStateProp(key)}
          />
        </FormItem>
      ))}

      <Button
        className="btn-primary"
        disabled={Validation.isNotValid(validation) || empty}
        label="userPasswordChangeView.changePassword"
        onClick={onChangePasswordClick}
      />
    </div>
  )
}

export default UserPasswordChange
