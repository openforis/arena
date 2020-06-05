import './ResetPassword.scss'
import React from 'react'

import * as User from '@core/user/user'

import { useI18n } from '@webapp/components/hooks'
import Error from '@webapp/views/Guest/components/Error'

import { useResetPasswordState } from './useResetPasswordState'

const ResetPassword = () => {
  const i18n = useI18n()
  const { user, resetPasswordState, setFormField, error, onClickSetNewPassword } = useResetPasswordState()

  if (!user) return null

  return (
    <>
      <input value={User.getEmail(user)} readOnly type="text" name="email" />

      <input
        defaultValue={resetPasswordState.name}
        onChange={setFormField}
        name="name"
        placeholder={i18n.t('loginView.yourName')}
      />

      <input
        defaultValue={resetPasswordState.password}
        onChange={setFormField}
        type="password"
        name="password"
        placeholder={i18n.t('loginView.yourNewPassword')}
      />

      <input
        defaultValue={resetPasswordState.passwordConfirm}
        onChange={setFormField}
        type="password"
        name="passwordConfirm"
        placeholder={i18n.t('loginView.repeatYourNewPassword')}
      />

      <div className="guest__buttons">
        <button type="submit" className="btn" onClick={onClickSetNewPassword}>
          {i18n.t('resetPasswordView.setNewPassword')}
        </button>
      </div>

      <Error error={error} />
    </>
  )
}

export default ResetPassword
