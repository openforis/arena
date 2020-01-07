import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { useI18n, useFormObject } from '@webapp/commonComponents/hooks'

import * as LoginState from '../loginState'
import { setEmail, login, setLoginError } from '../actions'

import * as LoginValidator from './loginValidator'
import { guestModules } from '@webapp/app/appModules'

const LoginForm = props => {
  const { email: initialEmail, setEmail: setStateEmail, login, setLoginError } = props

  const i18n = useI18n()

  const { object: formObject, setObjectField, objectValid, validation } = useFormObject(
    {
      email: initialEmail,
      password: '',
    },
    LoginValidator.validateLoginObj,
    true,
  )

  const onClickLogin = () => {
    if (objectValid) {
      login(formObject.email, formObject.password)
    } else {
      setLoginError(LoginValidator.getFirstError(validation, ['email', 'password']))
    }
  }

  const setEmail = email => {
    setStateEmail(email)
    setObjectField('email', email)
  }

  return (
    <>
      <input
        value={formObject.email}
        onChange={e => setEmail(e.target.value)}
        type="text"
        name="email"
        placeholder={i18n.t('loginView.yourEmail')}
      />

      <input
        value={formObject.password}
        onChange={e => setObjectField('password', e.target.value)}
        type="password"
        name="password"
        placeholder={i18n.t('loginView.yourPassword')}
      />

      <div className="login-form__buttons">
        <button type="button" className="btn btn-login" onClick={onClickLogin}>
          {i18n.t('loginView.login')}
        </button>
        <Link className="btn btn-s btn-transparent btn-forgot-pwd" to={guestModules.forgotPassword.path}>
          <span className="icon icon-question icon-left icon-12px" />
          {i18n.t('loginView.forgotPassword')}
        </Link>
      </div>
    </>
  )
}

const mapStateToProps = state => ({
  email: LoginState.getEmail(state),
})

export default connect(mapStateToProps, { setEmail, login, setLoginError })(LoginForm)
