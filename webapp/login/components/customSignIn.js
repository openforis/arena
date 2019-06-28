import React from 'react'
import { SignIn } from 'aws-amplify-react'
import { Hub } from 'aws-amplify'

import { withRouter } from 'react-router-dom'

// import axios from 'axios'

import { appModuleUri } from '../../loggedin/appModules'

class CustomSignIn extends SignIn {

  constructor (props) {
    super(props)
    this._validAuthStates = ['signIn', 'signedOut', 'signedUp']
  }

  // onAuthEvent (payload) {
  //   // ... your implementation
  // }

  componentDidMount () {
    Hub.listen('auth', async data => {
      // const { payload } = data
      // const { data: { user: serverUser, survey } } = await axios.get('/auth/user')

      // return { user: serverUser, survey }
      // this.onAuthEvent(payload)
      // console.log(payload)
      // console.log('A new auth event has happened: ', data.payload.data.username + ' has ' + data.payload.event)

      // console.log(appModuleUri())
      this.props.history.push(appModuleUri())
    })
  }

  showComponent (theme) {
    return (
      <div className="login__form">
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

export default withRouter(CustomSignIn)
