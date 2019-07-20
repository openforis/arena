import './style.scss'

import React, { useRef } from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { withRouter } from 'react-router'

import * as LoginState from './loginState'

import { login } from './actions'

const LoginView = (props) => {

  const { login, error } = props

  const usernameRef = useRef(null)
  const passwordRef = useRef(null)

  return (
    <React.Fragment>

      <div className="login__bg"/>

      <div className="login__openforis">
        <div className="openforis">
          {
            'openforis'.split('').map((letter, i) =>
              <div key={i}>{letter}</div>
            )
          }
        </div>
        <div className="arena">
          {
            'arena'.split('').map((letter, i) =>
              <div key={i}>{letter}</div>
            )
          }
        </div>
      </div>

      <div className="login-form">

        <div/>
        <input ref={usernameRef}
               type='text'
               name='username'
               className="login-form__input"
               placeholder='Your email'/>

        <input ref={passwordRef}
               type='password'
               name='password'
               className="login-form__input"
               placeholder='Your password'/>

        <div className="login-form__buttons">
          <button type="button"
                  className="btn btn-login"
                  onClick={() => login(usernameRef.current.value, passwordRef.current.value)}>
            Login
          </button>
          <button type="button" className="btn btn-s btn-transparent btn-forgot-pwd">
            <span className="icon icon-question icon-left icon-12px"/>
            Forgot Password
          </button>
        </div>

        {
          error &&
          <div className="login-form__error text-center">{error}</div>
        }

      </div>

    </React.Fragment>
  )
}

const mapStateToProps = state => ({
  error: LoginState.getError(state)
})

const enhance = compose(
  withRouter,
  connect(mapStateToProps, { login })
)

export default enhance(LoginView)
