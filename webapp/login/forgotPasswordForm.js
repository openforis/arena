import React from 'react'
import { connect } from 'react-redux'

import * as LoginState from './loginState'
import { setEmail, sendVerificationCode } from './actions'

const ForgotPasswordForm = props => {

  const {
    email,
    setEmail, sendVerificationCode
  } = props

  const onClickReset = () => {
    if (email) {
      sendVerificationCode(email)
    }
  }

  return (
    <div className="login-form">
      <input value={email}
             onChange={e => setEmail(e.target.value)}
             type='text'
             name='username'
             className="login-form__input"
             placeholder='Your email'/>

      <div className="login-form__buttons">
        <button type="button"
                className="btn btn-login"
                onClick={onClickReset}>
          <span className="icon icon-envelop icon-12px icon-left"/>
          Send verification code
        </button>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  email: LoginState.getEmail(state),
})

export default connect(mapStateToProps, {
  setEmail,
  sendVerificationCode,
})(ForgotPasswordForm)
