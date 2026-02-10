import './Login.scss'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import * as ProcessUtils from '@core/processUtils'

import { appModuleUri, guestModules } from '@webapp/app/appModules'

import { Button } from '@webapp/components'
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
  const is2FAViewState = useSelector(LoginState.is2FAViewState)
  const allowAccessRequest = ProcessUtils.ENV.allowUserAccessRequest

  const validatorFn = useCallback(
    (obj) => LoginValidator.validateLoginObj({ requireTwoFactorToken: is2FAViewState })(obj),
    [is2FAViewState]
  )

  const {
    object: formObject,
    setObjectField,
    objectValid,
    validation,
  } = useFormObject({ email, password: '', twoFactorToken: '' }, validatorFn, true)

  const onClickLogin = useCallback(() => {
    if (objectValid) {
      dispatch(LoginActions.login(formObject.email, formObject.password, formObject.twoFactorToken))
    } else {
      dispatch(
        LoginActions.setLoginError(
          LoginValidator.getFirstError(validation, [FormFields.email, FormFields.password, FormFields.twoFactorToken])
        )
      )
    }
  }, [objectValid, formObject, validation, dispatch])

  const onClickBack = useCallback(() => {
    dispatch(LoginActions.setViewState(ViewState.askUsernameAndPassword))
  }, [dispatch])

  const onChangeEmail = useCallback(
    (value) => {
      dispatch(LoginActions.setEmail(value))
      setObjectField(FormFields.email, value)
    },
    [dispatch, setObjectField]
  )

  const onChangePassword = useCallback(
    (value) => {
      dispatch(LoginActions.setLoginError(null))
      setObjectField(FormFields.password, value)
    },
    [dispatch, setObjectField]
  )

  const onChangeTwoFactorToken = useCallback(
    (value) => {
      dispatch(LoginActions.setLoginError(null))
      setObjectField(FormFields.twoFactorToken, value)
    },
    [dispatch, setObjectField]
  )

  const onLoginUsingBackupCodeClick = useCallback(() => {
    dispatch(LoginActions.setViewState(ViewState.ask2FABackupCode))
  }, [dispatch])

  return (
    <form onSubmit={(event) => event.preventDefault()} className="guest__form">
      {is2FAViewState && (
        <>
          <div className="two-factor-token-description">{i18n.t('loginView.twoFactorTokenDescription')}</div>
          <SimpleTextInput
            label={viewState === ViewState.ask2FAToken ? 'loginView.twoFactorToken' : 'loginView.twoFactorBackupCode'}
            name={FormFields.twoFactorToken}
            onChange={onChangeTwoFactorToken}
            value={formObject.twoFactorToken}
          />
          {viewState === ViewState.ask2FAToken && (
            <Button label="loginView.loginUsingBackupCode" onClick={onLoginUsingBackupCodeClick} variant="text" />
          )}
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
        {is2FAViewState ? (
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
