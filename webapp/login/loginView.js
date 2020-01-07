import './loginView.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as LoginState from './loginState'

import NotLoggedInView from '@webapp/guest/components/notLoggedInView'
import LoginForm from './components/loginForm'
import AcceptInvitationForm from './components/acceptInvitationForm'
import ForgotPasswordForm from '../guest/forgotPassword/forgotPasswordView'

const forms = {
  [LoginState.userActions.setNewPassword]: AcceptInvitationForm,
  [LoginState.userActions.login]: LoginForm,
  [LoginState.userActions.forgotPassword]: ForgotPasswordForm,
}

const LoginView = props => {
  const { userAction, error } = props

  return <NotLoggedInView error={error}>{React.createElement(forms[userAction], props)}</NotLoggedInView>
}

const mapStateToProps = state => ({
  userAction: LoginState.getUserAction(state),
  error: LoginState.getError(state),
})

export default connect(mapStateToProps)(LoginView)
