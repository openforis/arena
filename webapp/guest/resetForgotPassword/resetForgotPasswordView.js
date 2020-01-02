import './resetForgotPasswordView.scss'

import React from 'react'
import { Link } from 'react-router-dom'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { Input } from '@webapp/commonComponents/form/input'
import { useI18n } from '@webapp/commonComponents/hooks'

import LoginViewWrapper from '../components/loginViewWrapper'

import { useResetForgotPasswordState } from './resetForgotPasswordState'
import { appModules, appModuleUri } from '@webapp/loggedin/appModules'

const ResetCompleteContainer = ({ i18n }) => (
  <div className="reset-forgot-password__complete-container">
    <div className="info">{i18n.t('resetForgotPasswordView.resetPasswordComplete')}</div>
    <button className="btn">
      <Link to={appModuleUri(appModules.home)}>{i18n.t('resetForgotPasswordView.goToLoginPage')}</Link>
    </button>
  </div>
)

const ResetForgotPasswordView = () => {
  const i18n = useI18n()
  const {
    user,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    validation,
    onClickSetNewPassword,
    resetComplete,
  } = useResetForgotPasswordState()

  return (
    <LoginViewWrapper>
      {resetComplete ? (
        <ResetCompleteContainer i18n={i18n} />
      ) : user ? (
        <>
          <input value={User.getEmail(user)} readOnly={true} type="text" name="email" />

          <Input
            value={password}
            onChange={value => setPassword(value)}
            type="password"
            name="newPassword"
            validation={Validation.getFieldValidation('password')(validation)}
            placeholder={i18n.t('loginView.yourNewPassword')}
          />

          <Input
            value={passwordConfirm}
            onChange={value => setPasswordConfirm(value)}
            type="password"
            name="newPasswordRepeat"
            validation={Validation.getFieldValidation('passwordConfirm')(validation)}
            placeholder={i18n.t('loginView.repeatYourNewPassword')}
          />

          <div className="login-form__buttons">
            <button
              type="button"
              className="btn btn-login"
              onClick={onClickSetNewPassword}
              aria-disabled={!Validation.isValid(validation)}
            >
              {i18n.t('resetForgotPasswordView.setNewPassword')}
            </button>
          </div>
        </>
      ) : (
        <div className="error">{i18n.t('resetForgotPasswordView.forgotPasswordLinkInvalid')}</div>
      )}
    </LoginViewWrapper>
  )
}

export default ResetForgotPasswordView
