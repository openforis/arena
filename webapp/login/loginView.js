import './style.scss'

import React, { useState, useRef } from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { withRouter } from 'react-router'
import * as R from 'ramda'

import * as LoginState from './loginState'

import { login } from './actions'

const noCols = 12
const noRows = 6

const noCells = noCols * noRows - 6 * 4 + 1
const cells = R.range(0, noCells)

const ofLetters = {
  1: 'O',
  2: 'P',
  3: 'E',
  4: 'N',
  6: 'F',
  7: 'O',
  8: 'R',
  9: 'I',
  10: 'S'
}

const LoginView = (props) => {

  const { login, error } = props

  const usernameRef = useRef(null)
  const passwordRef = useRef(null)

  return (
    <React.Fragment>

      <div className="login__bg1 login"/>
      <div className="login__bg2 login"/>
      <div className="login__bg-overlay"/>

      <div className="login__container">

        <div className="login__grid">
          {
            cells.map(i => {
              const isLoginContainer = i === 15
              const ofLetter = ofLetters[i]
              return (
                <div key={i}
                     className={`${isLoginContainer ? 'login-form__container' : 'login__grid-cell'}`}>
                  {
                    isLoginContainer
                      ? (
                        <div className="login-form">

                          <input ref={usernameRef} type='text' name='username' placeholder='Your email'/>
                          <input ref={passwordRef} type='password' name='password' placeholder='Your password'/>
                          {
                            error &&
                            <div className="login-form__error-msg text-center">{error}</div>
                          }
                          <div className="buttons">
                            <button type="button"
                                    className="btn btn-login"
                                    onClick={() => login(usernameRef.current.value, passwordRef.current.value)}>
                              Login
                            </button>
                            <button type="button" className="btn btn-s btn-forgot-pwd">
                              <span className="icon icon-question icon-left icon-12px"/>
                              Forgot Password
                            </button>
                          </div>

                        </div>
                      )
                      : <div className={ofLetter ? 'of-letter' : ''}>{ofLetter}</div>
                  }
                </div>
              )
            })

          }
        </div>

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
