import './loginView.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as LoginState from './loginState'

import LoginForm from './loginForm'
import AcceptInvitationForm from './acceptInvitationForm'

const forms = {
  [LoginState.userActions.setNewPassword]: AcceptInvitationForm,
  [LoginState.userActions.login]: LoginForm,
}

const LoginView = props => {

  const { userAction, error } = props

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
        React.createElement(forms[userAction], props)
      }
    </>
  )
}

const mapStateToProps = state => ({
  userAction: LoginState.getUserAction(state),
  error: LoginState.getError(state),
})

export default connect(mapStateToProps)(LoginView)
