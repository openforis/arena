import React from 'react'
import { SignIn } from 'aws-amplify-react'

export class CustomSignIn extends SignIn {
  constructor (props) {
    super(props);
    this._validAuthStates = ['signIn', 'signedOut', 'signedUp'];
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
