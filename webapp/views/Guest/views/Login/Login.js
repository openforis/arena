import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router'

import * as ProcessUtils from '@core/processUtils'

import { appModuleUri, guestModules } from '@webapp/app/appModules'

import { Button } from '@webapp/components'
import { useFormObject } from '@webapp/components/hooks'
import { EmailInput, PasswordInput, VerificationCodeInput } from '@webapp/components/form'
import { SimpleTextInput } from '@webapp/components/form/SimpleTextInput'

import Error from '@webapp/views/Guest/Error'
import { GuestViewHeader } from '@webapp/views/Guest/components/GuestViewHeader'

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
    setObjectField(FormFields.twoFactorToken, '')
    dispatch(LoginActions.setLoginError(null))
    dispatch(LoginActions.setViewState(ViewState.askUsernameAndPassword))
  }, [dispatch, setObjectField])

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

  if (is2FAViewState) {
    return (
      <form onSubmit={(event) => event.preventDefault()} className="guest__form">
        <GuestViewHeader
          backToLogin
          description="guest:loginView.twoFactorTokenDescription"
          icon="icon-shield"
          onBackClick={onClickBack}
          title="guest:loginView.twoFactorTitle"
        />
        <Error error={error} />
        {viewState === ViewState.ask2FAToken ? (
          <VerificationCodeInput
            autoFocus
            label="guest:loginView.twoFactorToken"
            name={FormFields.twoFactorToken}
            onChange={onChangeTwoFactorToken}
            value={formObject.twoFactorToken}
          />
        ) : (
          <SimpleTextInput
            autoComplete="one-time-code"
            autoFocus
            label="guest:loginView.twoFactorBackupCode"
            name={FormFields.twoFactorToken}
            onChange={onChangeTwoFactorToken}
            value={formObject.twoFactorToken}
          />
        )}
        <Button className="guest__submit" label="guest:loginView.verify" onClick={onClickLogin} type="submit" />
        {viewState === ViewState.ask2FAToken && (
          <p className="guest__footnote">
            {i18n.t('guest:loginView.lostYourDevice')}{' '}
            <button type="button" className="guest__link btn-transparent" onClick={onLoginUsingBackupCodeClick}>
              {i18n.t('guest:loginView.loginUsingBackupCode')}
            </button>
          </p>
        )}
      </form>
    )
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} className="guest__form">
      <GuestViewHeader description="guest:loginView.subtitle" title="guest:loginView.title" />
      <Error error={error} />
      <EmailInput
        autoComplete="username"
        defaultValue={email}
        label="guest:loginView.yourEmail"
        name={FormFields.email}
        onChange={onChangeEmail}
      />
      <PasswordInput
        autoComplete="current-password"
        defaultValue={formObject.password}
        name={FormFields.password}
        label="guest:loginView.yourPassword"
        onChange={onChangePassword}
      />
      <Link className="guest__link guest-login__forgot-password" to={appModuleUri(guestModules.forgotPassword)}>
        {i18n.t('guest:loginView.forgotPassword')}
      </Link>
      <Button className="guest__submit" label="guest:loginView.login" onClick={onClickLogin} type="submit" />
      {allowAccessRequest && (
        <>
          <div className="guest__divider">{i18n.t('guest:loginView.or')}</div>
          <p className="guest__footnote">
            {i18n.t('guest:loginView.newToArena')}{' '}
            <Link className="guest__link" to={appModuleUri(guestModules.accessRequest)}>
              {i18n.t('guest:loginView.requestAccess')}
            </Link>
          </p>
        </>
      )}
    </form>
  )
}

export default Login
