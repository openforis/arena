import './loginView.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as LoginState from './loginState'

import NotLoggedInView from '@webapp/guest/components/notLoggedInView'
import LoginForm from './components/loginForm'
import AcceptInvitationForm from './components/acceptInvitationForm'

const forms = {
  [LoginState.userActions.setNewPassword]: AcceptInvitationForm,
  [LoginState.userActions.login]: LoginForm,
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
