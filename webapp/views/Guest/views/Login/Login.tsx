import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, Navigate, useSearchParams } from 'react-router'

import * as ProcessUtils from '@core/processUtils'
import * as User from '@core/user/user'

import { appModuleUri, appModules, guestModules } from '@webapp/app/appModules'

import { Button } from '@webapp/components'
import { useFormObject } from '@webapp/components/hooks'
import { EmailInput, PasswordInput, VerificationCodeInput } from '@webapp/components/form'
import { SimpleTextInput } from '@webapp/components/form/SimpleTextInput'

import Error from '@webapp/views/Guest/Error'
import { ExternalLoginButtons } from '@webapp/views/Guest/components/ExternalLoginButtons'
import { GuestViewHeader } from '@webapp/views/Guest/components/GuestViewHeader'

import { useI18n } from '@webapp/store/system'
import { LoginState, LoginValidator, LoginActions } from '@webapp/store/login'
import { useUser } from '@webapp/store/user'
import { useAppDispatch } from '@webapp/store'

const { ViewState } = LoginState

const FormFields = {
  email: 'email',
  password: 'password',
  twoFactorToken: 'twoFactorToken',
}

// handles the redirect back from an external login provider: error or 2FA step
const useExternalLoginRedirect = () => {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const errorKey = searchParams.get('externalLoginError')
    const step = searchParams.get('externalLoginStep')
    if (!errorKey && !step) return
    if (errorKey) {
      dispatch(LoginActions.setLoginError(LoginActions.toExternalLoginErrorMessageKey(errorKey)))
    }
    if (step === '2fa') {
      dispatch(LoginActions.setExternalLogin(true))
      dispatch(LoginActions.setViewState(ViewState.ask2FAToken))
    }
    // the params are consumed: a page reload does not show them again
    setSearchParams({}, { replace: true })
  }, [dispatch, searchParams, setSearchParams])
}

/**
 * Shown first, so that new users request access before trying to log in (e.g. with an external provider).
 * @returns {React.ReactElement} The banner element.
 */
const RequestAccessBanner = () => {
  const i18n = useI18n()
  return (
    <div className="guest-login__request-access" data-testid="login-request-access-banner">
      <div className="guest-login__request-access-text">
        <strong>{i18n.t('guest:loginView.newToArena')}</strong>
        <span>{i18n.t('guest:loginView.registerBeforeLoggingIn')}</span>
      </div>
      <Link className="guest-login__request-access-button" to={appModuleUri(guestModules.accessRequest)}>
        {i18n.t('guest:loginView.requestAccess')}
      </Link>
    </div>
  )
}

const Login = () => {
  const dispatch = useAppDispatch()
  const i18n = useI18n()
  const error = useSelector(LoginState.getError)
  const email = useSelector(LoginState.getEmail)
  const viewState = useSelector(LoginState.getViewState)
  const is2FAViewState = useSelector(LoginState.is2FAViewState)
  const allowAccessRequest = ProcessUtils.ENV.allowUserAccessRequest
  const externalLogin = useSelector(LoginState.isExternalLogin)
  const user = useUser()

  useExternalLoginRedirect()

  const validatorFn = useCallback(
    (obj) => LoginValidator.validateLoginObj({ requireTwoFactorToken: is2FAViewState, externalLogin })(obj),
    [is2FAViewState, externalLogin]
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
    dispatch(LoginActions.setExternalLogin(false))
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

  // logged in (e.g. just now): leave the guest views (the /guest/* route is rendered for logged-in users too)
  if (user && User.hasAccepted(user)) {
    return <Navigate to={appModuleUri(appModules.home)} replace />
  }

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
            focusOnMount
            label="guest:loginView.twoFactorToken"
            name={FormFields.twoFactorToken}
            onChange={onChangeTwoFactorToken}
            value={formObject.twoFactorToken}
          />
        ) : (
          <SimpleTextInput
            autoComplete="one-time-code"
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
      {allowAccessRequest && <RequestAccessBanner />}
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
      <ExternalLoginButtons captionKey="guest:externalLogin.registeredUsersOnly" />
    </form>
  )
}

export default Login
