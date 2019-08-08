import React, { useRef } from 'react'
import { connect } from 'react-redux'

import { login, forgotPassword } from './actions'

const LoginForm = props => {

  const { login, forgotPassword, } = props

  const email = useRef(null)
  const password = useRef(null)

  return (
    <div className="login-form">
      <input ref={email}
             type='text'
             name='email'
             className="login-form__input"
             placeholder='Your email'/>

      <input ref={password}
             type='password'
             name='password'
             className="login-form__input"
             placeholder='Your password'/>

      <div className="login-form__buttons">

        <button type="button"
                className="btn btn-login"
                onClick={() => login(email.current.value, password.current.value)}>
          Login
        </button>

        <button type="button"
                className="btn btn-s btn-transparent btn-forgot-pwd"
                onClick={forgotPassword}>
          <span className="icon icon-question icon-left icon-12px"/>
          Forgot Password
        </button>

      </div>
    </div>
  )
}

export default connect(null, { login, forgotPassword })(LoginForm)
