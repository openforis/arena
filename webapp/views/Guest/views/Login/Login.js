import './Login.scss'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import * as ProcessUtils from '@core/processUtils'

import { appModuleUri, guestModules } from '@webapp/app/appModules'

import { useFormObject } from '@webapp/components/hooks'
import { EmailInput, PasswordInput } from '@webapp/components/form'
import { SimpleTextInput } from '@webapp/components/form/SimpleTextInput'

import Error from '@webapp/views/Guest/Error'

import { useI18n } from '@webapp/store/system'
import { LoginState, LoginValidator, LoginActions } from '@webapp/store/login'

const { ViewState } = LoginState

const FormFields = {
  email: 'email',
  password: 'password',
  twoFactorToken: 'twoFactorToken',
}

const Login = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const error = useSelector(LoginState.getError)
  const email = useSelector(LoginState.getEmail)
  const viewState = useSelector(LoginState.getViewState)
  const allowAccessRequest = ProcessUtils.ENV.allowUserAccessRequest

  const {
    object: formObject,
    setObjectField,
    objectValid,
    validation,
  } = useFormObject({ email, password: '', twoFactorToken: '' }, LoginValidator.validateLoginObj, true)

  const onClickLogin = useCallback(() => {
    if (objectValid) {
      dispatch(LoginActions.login(formObject.email, formObject.password, formObject.twoFactorToken))
    } else {
      dispatch(
        LoginActions.setLoginError(LoginValidator.getFirstError(validation, [FormFields.email, FormFields.password]))
      )
    }
  }, [objectValid, formObject, validation, dispatch])

  const onClickBack = useCallback(() => {
    dispatch(LoginActions.setViewState(ViewState.askUsernameAndPassword))
  }, [dispatch])

  const onChangeEmail = (value) => {
    dispatch(LoginActions.setEmail(value))
    setObjectField(FormFields.email, value)
  }

  const onChangePassword = (value) => {
    dispatch(LoginActions.setLoginError(null))
    setObjectField(FormFields.password, value)
  }

  const onChangeTwoFactorToken = (value) => {
    dispatch(LoginActions.setLoginError(null))
    setObjectField(FormFields.twoFactorToken, value)
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} className="guest__form">
      {viewState === ViewState.askTwoFactorToken && (
        <>
          <div className="two-factor-token-description">{i18n.t('loginView.twoFactorTokenDescription')}</div>
          <SimpleTextInput
            label="loginView.twoFactorToken"
            name={FormFields.twoFactorToken}
            onChange={onChangeTwoFactorToken}
            value={formObject.twoFactorToken}
          />
        </>
      )}
      {viewState === ViewState.askUsernameAndPassword && (
        <>
          <EmailInput
            defaultValue={email}
            label="loginView.yourEmail"
            name={FormFields.email}
            onChange={onChangeEmail}
          />

          <PasswordInput
            defaultValue={formObject.password}
            name={FormFields.password}
            label="loginView.yourPassword"
            onChange={onChangePassword}
          />

          <Link
            className="btn btn-s btn-transparent guest-login__btn-forgot-pwd"
            to={appModuleUri(guestModules.forgotPassword)}
          >
            <span className="icon icon-question icon-left icon-12px" />
            {i18n.t('loginView.forgotPassword')}
          </Link>
        </>
      )}
      <div className="guest__buttons">
        {viewState === ViewState.askTwoFactorToken ? (
          <button type="button" className="btn back" onClick={onClickBack}>
            {i18n.t('common.back')}
          </button>
        ) : (
          <span className="spacer" />
        )}
        <button type="submit" className="btn login" onClick={onClickLogin}>
          {i18n.t('loginView.login')}
        </button>
        <span className="spacer" />
      </div>

      {allowAccessRequest && viewState === ViewState.askUsernameAndPassword && (
        <Link
          className="btn btn-s btn-transparent guest-login__btn-request-access"
          to={appModuleUri(guestModules.accessRequest)}
        >
          <span className="icon icon-question icon-left icon-12px" />
          {i18n.t('loginView.requestAccess')}
        </Link>
      )}
      <Error error={error} />
    </form>
  )
}

export default Login
