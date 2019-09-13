import React, { useState } from 'react'
import { connect } from 'react-redux'

import useI18n from '../../commonComponents/useI18n'

import * as LoginState from '../loginState'
import { setEmail, login, showForgotPasswordForm } from '../actions'

const LoginForm = props => {

  const {
    email,
    setEmail, login, showForgotPasswordForm
  } = props

  const i18n = useI18n()

  const [password, setPassword] = useState('')

  return (
    <div className="login-form">
      <input value={email}
             onChange={e => setEmail(e.target.value)}
             type='text'
             name='email'
             className="login-form__input"
             placeholder={i18n.t('loginView.yourEmail')}/>

      <input value={password}
             onChange={e => setPassword(e.target.value)}
             type='password'
             name='password'
             className="login-form__input"
             placeholder={i18n.t('loginView.yourPassword')}/>

      <div className="login-form__buttons">

        <button type="button"
                className="btn btn-login"
                onClick={() => login(email, password)}>
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

export default connect(mapStateToProps, { setEmail, login, showForgotPasswordForm })(LoginForm)
