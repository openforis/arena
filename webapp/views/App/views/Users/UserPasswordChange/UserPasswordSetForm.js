import React from 'react'

import * as Validation from '@core/validation/validation'
import { UserPasswordChangeForm } from '@core/user/userPasswordChangeForm'

import ValidationTooltip from '@webapp/components/validationTooltip'
import { PasswordInput, PasswordStrengthChecker } from '@webapp/components/form'

export const UserPasswordSetForm = (props) => {
  const { form, onFieldChange, passwordChange = false, validation = null } = props

  const availableFormKeys = Object.values(UserPasswordChangeForm.keys).filter(
    (key) => passwordChange || key !== UserPasswordChangeForm.keys.oldPassword
  )

  return availableFormKeys.map((key) => (
    <div key={key}>
      <ValidationTooltip validation={Validation.getFieldValidation(key)(validation)} className="form-input-container">
        <PasswordInput
          autoComplete={key === UserPasswordChangeForm.keys.oldPassword ? 'password' : 'new-password'}
          label={`userPasswordChangeView.${key}`}
          onChange={onFieldChange(key)}
          value={form[key]}
        />
      </ValidationTooltip>

      {key === UserPasswordChangeForm.keys.newPassword && (
        <PasswordStrengthChecker password={UserPasswordChangeForm.getNewPassword(form)} />
      )}
    </div>
  ))
}
