import React from 'react'
import { connect } from 'react-redux'

import { useI18n, useFormObject } from '@webapp/commonComponents/hooks'

import * as LoginState from '../loginState'
import { setEmail, login, showForgotPasswordForm, setLoginError } from '../actions'

import * as LoginValidator from './loginValidator'

const LoginForm = props => {

  const {
    email: initialEmail,
    setEmail: setStateEmail, login, showForgotPasswordForm, setLoginError
  } = props

  const i18n = useI18n()

  const {
    object: formObject,
    setObjectField,
    objectValid,
    validation,
  } = useFormObject({
    email: initialEmail,
    password: '',
  }, LoginValidator.validateLoginObj, true)

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
    <div className="login-form">
      <input value={formObject.email}
             onChange={e => setEmail(e.target.value)}
             type='text'
             name='email'
             className="login-form__input"
             placeholder={i18n.t('loginView.yourEmail')}/>

      <input value={formObject.password}
             onChange={e => setObjectField('password', e.target.value)}
             type='password'
             name='password'
             className="login-form__input"
             placeholder={i18n.t('loginView.yourPassword')}/>

      <div className="login-form__buttons">

        <button type="button"
                className="btn btn-login"
                onClick={onClickLogin}>
          {i18n.t('loginView.login')}
        </button>

        <button type="button"
                className="btn btn-s btn-transparent btn-forgot-pwd"
                onClick={showForgotPasswordForm}>
          <span className="icon icon-question icon-left icon-12px"/>
          {i18n.t('loginView.forgotPassword')}
        </button>

      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  email: LoginState.getEmail(state),
})

export default connect(mapStateToProps, {
  setEmail,
  login,
  showForgotPasswordForm,
  setLoginError,
})(LoginForm)
