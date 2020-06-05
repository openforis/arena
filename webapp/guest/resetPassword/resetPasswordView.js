import './resetPasswordView.scss'

import React from 'react'

import * as User from '@core/user/user'

import { useI18n } from '@webapp/components/hooks'

import NotLoggedIn from '@webapp/views/Guest/views/components/NotLoggedIn'

import { useResetPasswordState } from './useResetPasswordState'

const ResetPasswordView = () => {
  const i18n = useI18n()
  const {
    user,
    name,
    setName,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    error,
    onClickSetNewPassword,
  } = useResetPasswordState()

  return (
    <NotLoggedIn error={error}>
      {user && (
        <>
          <input value={User.getEmail(user)} readOnly type="text" name="email" />

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            name="name"
            placeholder={i18n.t('loginView.yourName')}
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            name="password"
            placeholder={i18n.t('loginView.yourNewPassword')}
          />

          <input
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            type="password"
            name="passwordConfirm"
            placeholder={i18n.t('loginView.repeatYourNewPassword')}
          />

          <div className="not-logged-in__buttons">
            <button type="submit" className="btn" onClick={onClickSetNewPassword}>
              {i18n.t('resetPasswordView.setNewPassword')}
            </button>
          </div>
        </>
      )}
    </NotLoggedIn>
  )
}

export default ResetPasswordView
