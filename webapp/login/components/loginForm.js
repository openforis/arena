import React from 'react'
import { connect } from 'react-redux'

import useFormObject from '../../commonComponents/hooks/useFormObject'

import * as LoginState from '../loginState'
import { setEmail, login, showForgotPasswordForm, setLoginError } from '../actions'

import * as LoginValidator from './loginValidator'

const LoginForm = props => {

  const {
    email: initialEmail,
    setEmail: setStateEmail, login, showForgotPasswordForm, setLoginError
  } = props

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
      console.log(LoginValidator.getFirstError(validation, ['email', 'password']))
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
             placeholder='Your email'/>

      <input value={formObject.password}
             onChange={e => setObjectField('password', e.target.value)}
             type='password'
             name='password'
             className="login-form__input"
             placeholder='Your password'/>

      <div className="login-form__buttons">

        <button type="button"
                className="btn btn-login"
                onClick={onClickLogin}>
          Login
        </button>

        <button type="button"
                className="btn btn-s btn-transparent btn-forgot-pwd"
                onClick={showForgotPasswordForm}>
          <span className="icon icon-question icon-left icon-12px"/>
          Forgot Password
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
