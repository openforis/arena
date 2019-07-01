import React from 'react'
import { SignIn } from 'aws-amplify-react'
import { Hub } from 'aws-amplify'

import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { appModuleUri } from '../../loggedin/appModules'

import { initApp } from '../../app/actions'

class CustomSignIn extends SignIn {

  constructor (props) {
    super(props)

    this._validAuthStates = ['signIn', 'signedOut', 'signedUp']
  }

  componentDidMount () {
    Hub.listen('auth', async data => {
      // const { payload } = data
      // console.log('A new auth event has happened: ', data.payload.data.username + ' has ' + data.payload.event)
      // const { data: { user: serverUser, survey } } = await axios.get('/auth/user')

      this.props.initApp()
      this.props.history.push(appModuleUri())
    })
  }

  showComponent (theme) {
    return (
      <div className="login__form" style={{ position: 'fixed' }}>
        <form>
          <div>
            <label
              htmlFor="username">
              Username
            </label>
            <input
              id="username"
              key="username"
              name="username"
              onChange={this.handleInputChange}
              type="text"
              placeholder="Username"
            />
          </div>
          <div>
            <label
              htmlFor="password">
              Password
            </label>
            <input
              id="password"
              key="password"
              name="password"
              onChange={this.handleInputChange}
              type="password"
              placeholder="******************"/>
            {/* <p className="text-grey-dark text-xs">
              Forgot your password?{' '}
              <a
                onClick={() => super.changeState('forgotPassword')}>
                Reset Password
              </a>
            </p> */}
          </div>
          <div className="buttons">
            <button
              type="button"
              className="btn btn-of"
              onClick={() => super.signIn()}>
              Login
            </button>
            {/* <p className="text-grey-dark text-xs">
              No Account?{' '}
              <a
                onClick={() => super.changeState('signUp')}>
                Create account
              </a>
            </p> */}
          </div>
        </form>
      </div>
    )
  }
}

const enhance = compose(
  withRouter,
  connect(
    null,
    { initApp }
  )
)
export default enhance(CustomSignIn)

// export default withRouter(CustomSignIn)
