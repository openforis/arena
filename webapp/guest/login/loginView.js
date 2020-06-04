import './loginView.scss'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useI18n, useFormObject } from '@webapp/components/hooks'
import NotLoggedInView from '@webapp/guest/components/notLoggedInView'

import { guestModules } from '@webapp/app/appModules'

import * as LoginValidator from '@webapp/guest/login/loginValidator'
import * as LoginState from './loginState'
import { setEmail, login, setLoginError } from '@webapp/guest/login/actions'

const LoginView = () => {
  const error = useSelector(LoginState.getError)
  const email = useSelector(LoginState.getEmail)
  const i18n = useI18n()
  const dispatch = useDispatch()

  const { object: formObject, setObjectField, objectValid, validation } = useFormObject(
    { email, password: '' },
    LoginValidator.validateLoginObj,
    true,
  )

  const onClickLogin = () => {
    if (objectValid) {
      dispatch(login(formObject.email, formObject.password))
    } else {
      dispatch(setLoginError(LoginValidator.getFirstError(validation, ['email', 'password'])))
    }
  }

  const onChangeEmail = e => {
    const email = e.target.value
    dispatch(setEmail(email))
    setObjectField('email', email)
  }

  const onChangePassword = e => {
    dispatch(setLoginError(null))
    setObjectField('password', e.target.value)
  }

  return (
    <NotLoggedInView error={error}>
      <input
        value={formObject.email}
        onChange={onChangeEmail}
        type="text"
        name="email"
        placeholder={i18n.t('loginView.yourEmail')}
      />

      <input
        value={formObject.password}
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
    </NotLoggedInView>
  )
}

export default LoginView
