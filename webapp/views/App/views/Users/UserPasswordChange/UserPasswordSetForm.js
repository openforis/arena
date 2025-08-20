import React, { useCallback, useMemo, useState } from 'react'

import * as Validation from '@core/validation/validation'
import { UserPasswordChangeForm } from '@core/user/userPasswordChangeForm'

import { PasswordInput, PasswordStrengthChecker } from '@webapp/components/form'
import { FormItemWithValidation } from '@webapp/components/form/FormItemWithValidation'
import { useIsMobile } from '@webapp/components/hooks/useIsMobile'

export const UserPasswordSetForm = (props) => {
  const { form: formProp, onFieldChange: onFieldChangeProp, passwordChange = false, validation = undefined } = props

  const [form, setForm] = useState(formProp)
  const isMobile = useIsMobile()

  const availableFormKeys = useMemo(
    () =>
      Object.values(UserPasswordChangeForm.keys).filter(
        (key) => passwordChange || key !== UserPasswordChangeForm.keys.oldPassword
      ),
    [passwordChange]
  )

  const onFieldChange = useCallback(
    (key) => (value) => {
      setForm((prevForm) => ({ ...prevForm, [key]: value }))
      onFieldChangeProp?.(key)(value)
    },
    [onFieldChangeProp]
  )

  const labelKeyPrefix = passwordChange ? 'userPasswordChangeView' : 'userView'

  return availableFormKeys.map((key) => (
    <div key={key}>
      <FormItemWithValidation
        hideLabelInMobile
        label={`${labelKeyPrefix}.${key}`}
        validation={Validation.getFieldValidation(key)(validation)}
      >
        <PasswordInput
          autoComplete={key === UserPasswordChangeForm.keys.oldPassword ? 'password' : 'new-password'}
          label={isMobile ? `${labelKeyPrefix}.${key}` : undefined}
          onChange={onFieldChange(key)}
          value={form[key] ?? ''}
        />
      </FormItemWithValidation>
      {key === UserPasswordChangeForm.keys.newPassword && (
        <PasswordStrengthChecker password={UserPasswordChangeForm.getNewPassword(form)} />
      )}
    </div>
  ))
}
