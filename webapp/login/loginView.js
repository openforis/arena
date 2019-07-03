import './style.scss'

import React from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { withRouter } from 'react-router'
import * as R from 'ramda'

import { SignIn } from 'aws-amplify-react'
import { Hub } from 'aws-amplify'

import { initUser } from '../app/actions'
import { appModuleUri } from '../loggedin/appModules'

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

class LoginView extends SignIn {

  constructor (props) {
    super(props)

    // this._validAuthStates = ['signIn', 'signedOut', 'signedUp']
    this.state = { errorMessage: null }
  }

  resetState () {
    this.setState({ errorMessage: null })
  }

  componentDidMount () {
    Hub.listen('auth', async data => {
      const { payload } = data
      switch (data.payload.event) {

        case 'signIn':
          this.props.initUser()
          this.resetState()
          this.props.history.push(appModuleUri())
          break
        // case 'signUp':
        //   // logger.error('user signed up');
        //   break
        case 'signOut':
          this.props.history.push('/')
          break
        case 'signIn_failure':
          this.setState({ errorMessage: payload.data.message })
          // logger.error('user sign in failed');
          break
        // case 'configured':
        //   // logger.error('the Auth module is configured');
        //   break
        }

    })
  }

  render () {
    const { errorMessage } = this.state

    return (
      this.props.authState === 'signIn' &&
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

                              <input ref="username" type='text' name='username' placeholder='Your email'
                                     onChange={this.handleInputChange}/>
                              <input ref="password" type='password' name='password' placeholder='Your password'
                                     onChange={this.handleInputChange}/>
                              {
                                errorMessage
                                  ? <div className="login-form__error-msg text-center">{errorMessage}</div>
                                  : null
                              }
                              <div className="buttons">
                                <button type="button"
                                        className="btn btn-login"
                                        onClick={() => super.signIn()}>
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
}

const enhance = compose(
  withRouter,
  connect(null, { initUser })
)

export default enhance(LoginView)
