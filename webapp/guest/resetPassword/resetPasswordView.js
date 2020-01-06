import './resetPasswordView.scss'

import React from 'react'
import { Link } from 'react-router-dom'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { Input } from '@webapp/commonComponents/form/input'
import { useI18n } from '@webapp/commonComponents/hooks'

import GuestViewWrapper from '../components/guestViewWrapper'

import { useResetPasswordState } from './resetPasswordState'
import { appModules, appModuleUri } from '@webapp/app/appModules'

const ResetCompleteContainer = ({ i18n }) => (
  <div className="reset-password__complete-container">
    <div className="info">{i18n.t('resetPasswordView.resetPasswordComplete')}</div>
    <button className="btn">
      <Link to={appModuleUri(appModules.home)}>{i18n.t('resetPasswordView.goToLoginPage')}</Link>
    </button>
  </div>
)

const ResetPasswordView = () => {
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
  } = useResetPasswordState()

  return (
    <GuestViewWrapper>
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
              {i18n.t('resetPasswordView.setNewPassword')}
            </button>
          </div>
        </>
      ) : (
        <div className="error">{i18n.t('resetPasswordView.forgotPasswordLinkInvalid')}</div>
      )}
    </GuestViewWrapper>
  )
}

export default ResetPasswordView
