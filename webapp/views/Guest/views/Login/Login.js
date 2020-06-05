import './Login.scss'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import NotLoggedIn from '@webapp/components/NotLoggedIn/NotLoggedIn'

import * as LoginState from '@webapp/guest/login/loginState'
import { useFormObject, useI18n } from '@webapp/components/hooks'
import * as LoginValidator from '@webapp/guest/login/loginValidator'
import { login, setEmail, setLoginError } from '@webapp/guest/login/actions'

import { guestModules } from '@webapp/app/appModules'

const Login = () => {
  const error = useSelector(LoginState.getError)
  const email = useSelector(LoginState.getEmail)
  const i18n = useI18n()
  const dispatch = useDispatch()

  const { object: formObject, setObjectField, objectValid, validation } = useFormObject(
    { email, password: '' },
    LoginValidator.validateLoginObj,
    true
  )

  const onClickLogin = () => {
    if (objectValid) {
      dispatch(login(formObject.email, formObject.password))
    } else {
      dispatch(setLoginError(LoginValidator.getFirstError(validation, ['email', 'password'])))
    }
  }

  const onChangeEmail = (event) => {
    const emailChanged = event.target.value
    dispatch(setEmail(emailChanged))
    setObjectField('email', emailChanged)
  }

  const onChangePassword = (event) => {
    dispatch(setLoginError(null))
    setObjectField('password', event.target.value)
  }

  return (
    <NotLoggedIn error={error}>
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

      <div className="not-logged-in__buttons">
        <button type="submit" className="btn" onClick={onClickLogin}>
          {i18n.t('loginView.login')}
        </button>
        <Link className="btn btn-s btn-transparent btn-forgot-pwd" to={guestModules.forgotPassword.path}>
          <span className="icon icon-question icon-left icon-12px" />
          {i18n.t('loginView.forgotPassword')}
        </Link>
      </div>
    </NotLoggedIn>
  )
}

export default Login
