import './loginView.scss'

import React from 'react'
import {connect} from 'react-redux'

import {useI18n} from '@webapp/commonComponents/hooks'

import * as LoginState from './loginState'

import LoginForm from './components/loginForm'
import AcceptInvitationForm from './components/acceptInvitationForm'
import ForgotPasswordForm from './components/forgotPasswordForm'
import ResetPasswordForm from './components/resetPasswordForm'

const forms = {
  [LoginState.userActions.setNewPassword]: AcceptInvitationForm,
  [LoginState.userActions.login]: LoginForm,
  [LoginState.userActions.forgotPassword]: ForgotPasswordForm,
  [LoginState.userActions.resetPassword]: ResetPasswordForm,
}

const LoginView = props => {
  const {userAction, error} = props

  const i18n = useI18n()

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
        <div className="login-form__error text-center">{i18n.t(error)}</div>
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
