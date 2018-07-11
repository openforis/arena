import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router'

import { login } from './../actions'
import { appUri, appUser } from '../../app/app'

class LoginForm extends React.Component {

  render () {
    const {login, errorMessage, user} = this.props

    return (
      user
        ? (
          <Redirect to={appUri}/>
        )
        : (
          <div className="login__form">

            <input ref="username" type='text' name='username' placeholder='Your email'/>
            <input ref="password" type='password' name='password' placeholder='Your password'/>
            {
              errorMessage
                ? <div className="error text-center">{errorMessage}</div>
                : null
            }
            <div className="buttons">
              <button type="button"
                      className="btn btn-of"
                      onClick={() => login(this.refs.username.value, this.refs.password.value)}>
                Login
              </button>
              <button type="button" className="btn btn-link">Password??</button>
            </div>

          </div>
        )
    )
  }

}

const mapStateToProps = state => ({
  ...state.login,
  user: appUser(state)
})

export default connect(mapStateToProps, {login})(LoginForm)