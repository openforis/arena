import React, { useMemo } from 'react'

import * as Validation from '@core/validation/validation'
import { UserPasswordChangeForm } from '@core/user/userPasswordChangeForm'

import { PasswordInput, PasswordStrengthChecker } from '@webapp/components/form'
import { FormItemWithValidation } from '@webapp/components/form/FormItemWithValidation'
import { useIsMobile } from '@webapp/components/hooks/useIsMobile'

export const UserPasswordSetForm = (props) => {
  const { form, onFieldChange, passwordChange = false, validation = null } = props

  const isMobile = useIsMobile()

  const availableFormKeys = useMemo(
    () =>
      Object.values(UserPasswordChangeForm.keys).filter(
        (key) => passwordChange || key !== UserPasswordChangeForm.keys.oldPassword
      ),
    [passwordChange]
  )

  const labelKeyPrefix = passwordChange ? 'userPasswordChangeView' : 'userView'

  return availableFormKeys.map((key) => (
    <div key={key}>
      <FormItemWithValidation hideLabelInMobile label={`${labelKeyPrefix}.${key}`}>
        <PasswordInput
          autoComplete={key === UserPasswordChangeForm.keys.oldPassword ? 'password' : 'new-password'}
          label={isMobile ? `${labelKeyPrefix}.${key}` : undefined}
          onChange={(value) => onFieldChange(key)(value)}
          validation={Validation.getFieldValidation(key)(validation)}
          value={form[key]}
        />
      </FormItemWithValidation>
      {key === UserPasswordChangeForm.keys.newPassword && (
        <PasswordStrengthChecker password={UserPasswordChangeForm.getNewPassword(form)} />
      )}
    </div>
  ))
}
