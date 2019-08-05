import './loginView.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as LoginState from './loginState'

import LoginForm from './loginForm'
import AcceptInvitationView from './acceptInvitationView'

const LoginView = props => {

  const { error, newPasswordRequired } = props

  return (
    <>
      <div className="login__bg"/>

      <div className="login__openforis">
        <div className="openforis">
          {
            'open'.split('').map((letter, i) =>
              <div key={i}>{letter}</div>
            )
          }
          <div className="separator">∞</div>
          {
            'foris'.split('').map((letter, i) =>
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

      {
        error &&
        <div className="login-form__error text-center">{error}</div>
      }

      {
        newPasswordRequired
          ? <AcceptInvitationView />
          : <LoginForm />
      }
    </>
  )
}

const mapStateToProps = state => ({
  newPasswordRequired: LoginState.getPasswordResetUser(state),
  error: LoginState.getError(state),
})

export default connect(mapStateToProps)(LoginView)
