import './UserPasswordChange.scss'

import React, { useState } from 'react'

import * as Validation from '@core/validation/validation'
import { UserPasswordChangeForm } from '@core/user/userPasswordChangeForm'
import { UserPasswordChangeFormValidator } from '@core/user/userPasswordChangeFormValidator'

import * as API from '@webapp/service/api'

import { useI18n } from '@webapp/store/system'

import { Button } from '@webapp/components'
import { useNotifyInfo } from '@webapp/components/hooks'
import { PasswordInput, PasswordStrengthChecker } from '@webapp/components/form'
import ValidationTooltip from '@webapp/components/validationTooltip'

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
        <div key={key}>
          <ValidationTooltip
            validation={Validation.getFieldValidation(key)(validation)}
            className="form-input-container"
          >
            <PasswordInput
              autoComplete={key === UserPasswordChangeForm.keys.oldPassword ? 'password' : 'new-password'}
              label={i18n.t(`userPasswordChangeView.${key}`)}
              onChange={setStateProp(key)}
              value={form[key]}
            />
          </ValidationTooltip>

          {key === UserPasswordChangeForm.keys.newPassword && (
            <PasswordStrengthChecker password={UserPasswordChangeForm.getNewPassword(form)} />
          )}
        </div>
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
