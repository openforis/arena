import './ResetPassword.scss'
import React from 'react'

import { useI18n } from '@webapp/components/hooks'
import Error from '@webapp/views/Guest/Error'

import { useResetPassword } from './store/hooks'

const ResetPassword = () => {
  const i18n = useI18n()

  const {
    state: { user, error },
    onChangeUser,
    onSubmit,
  } = useResetPassword()

  if (!user || !user.email) return null

  return (
    <>
      <input value={user.email} readOnly type="text" name="email" />

      <input defaultValue={user.name} onChange={onChangeUser} name="name" placeholder={i18n.t('loginView.yourName')} />

      <input
        defaultValue={user.password}
        onChange={onChangeUser}
        type="password"
        name="password"
        placeholder={i18n.t('loginView.yourNewPassword')}
      />

      <input
        defaultValue={user.passwordConfirm}
        onChange={onChangeUser}
        type="password"
        name="passwordConfirm"
        placeholder={i18n.t('loginView.repeatYourNewPassword')}
      />

      <div className="guest__buttons">
        <button type="submit" className="btn" onClick={onSubmit}>
          {i18n.t('resetPasswordView.setNewPassword')}
        </button>
      </div>

      <Error error={error} />
    </>
  )
}

export default ResetPassword
