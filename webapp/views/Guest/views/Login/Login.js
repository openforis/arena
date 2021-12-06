import './Login.scss'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { appModuleUri, guestModules } from '@webapp/app/appModules'

import { useFormObject } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'
import Error from '@webapp/views/Guest/Error'

import { LoginState, LoginValidator, LoginActions } from '@webapp/store/login'

const Login = () => {
  const error = useSelector(LoginState.getError)
  const email = useSelector(LoginState.getEmail)
  const i18n = useI18n()
  const dispatch = useDispatch()

  const {
    object: formObject,
    setObjectField,
    objectValid,
    validation,
  } = useFormObject({ email, password: '' }, LoginValidator.validateLoginObj, true)

  const onClickLogin = () => {
    if (objectValid) {
      dispatch(LoginActions.login(formObject.email, formObject.password))
    } else {
      dispatch(LoginActions.setLoginError(LoginValidator.getFirstError(validation, ['email', 'password'])))
    }
  }

  const onChangeEmail = (event) => {
    const emailChanged = event.target.value
    dispatch(LoginActions.setEmail(emailChanged))
    setObjectField('email', emailChanged)
  }

  const onChangePassword = (event) => {
    dispatch(LoginActions.setLoginError(null))
    setObjectField('password', event.target.value)
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} className="guest__form">
      <input
        defaultValue={formObject.email}
        onChange={onChangeEmail}
        type="text"
        name="email"
        placeholder={i18n.t('loginView.yourEmail')}
      />

      <input
        defaultValue={formObject.password}
        onChange={onChangePassword}
        type="password"
        name="password"
        placeholder={i18n.t('loginView.yourPassword')}
      />

      <Link
        className="btn btn-s btn-transparent guest-login__btn-forgot-pwd"
        to={appModuleUri(guestModules.forgotPassword)}
      >
        <span className="icon icon-question icon-left icon-12px" />
        {i18n.t('loginView.forgotPassword')}
      </Link>

      <div className="guest__buttons">
        <button type="submit" className="btn" onClick={onClickLogin}>
          {i18n.t('loginView.login')}
        </button>
      </div>

      <Link
        className="btn btn-s btn-transparent guest-login__btn-request-access"
        to={appModuleUri(guestModules.accessRequest)}
      >
        <span className="icon icon-question icon-left icon-12px" />
        {i18n.t('loginView.requestAccess')}
      </Link>

      <Error error={error} />
    </form>
  )
}

export default Login
