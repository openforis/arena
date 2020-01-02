import React, { useEffect } from 'react'

import * as User from '@core/user/user'

import { useI18n } from '@webapp/commonComponents/hooks'

import LoginViewWrapper from './components/loginViewWrapper'

import { useResetForgotPasswordState } from './resetForgotPasswordState'
import { useParams } from 'react-router-dom'

const ResetForgotPasswordView = props => {
  const i18n = useI18n()
  const {
    user,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    onClickSetNewPassword,
  } = useResetForgotPasswordState()

  useEffect(() => {}, [])

  return (
    <LoginViewWrapper>
      {user ? (
        <>
          <input value={User.getEmail(user)} readOnly={true} type="text" name="email" />

          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            name="newPassword"
            placeholder={i18n.t('loginView.yourNewPassword')}
          />

          <input
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
            type="password"
            name="newPasswordRepeat"
            placeholder={i18n.t('loginView.repeatYourNewPassword')}
          />

          <div className="login-form__buttons">
            <button type="button" className="btn btn-login" onClick={onClickSetNewPassword}>
              {i18n.t('loginView.setNewPassword')}
            </button>
          </div>
        </>
      ) : (
        <div>{i18n.t('loginView.forgotPasswordLinkInvalid')}</div>
      )}
    </LoginViewWrapper>
  )
}

export default ResetForgotPasswordView
