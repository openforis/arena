import React, { useRef } from 'react'
import { connect } from 'react-redux'

import { sendResetPasswordRequest } from './actions'

const ForgotPasswordForm = props => {

  const { sendResetPasswordRequest } = props

  const emailRef = useRef(null)

  const onClickReset = () => {
    const email = emailRef.current.value
    if (email) {
      sendResetPasswordRequest(email)
    }
  }

  return (
    <div className="login-form">
      <input ref={emailRef}
             type='text'
             name='username'
             className="login-form__input"
             placeholder='Your email'/>

      <div className="login-form__buttons">
        <button type="button"
                className="btn btn-login"
                aria-disabled={false}
                onClick={onClickReset}>
          <span className="icon icon-envelop icon-12px icon-left"/>
          Send verification code
        </button>
      </div>
    </div>
  )
}

export default connect(null, { sendResetPasswordRequest })(ForgotPasswordForm)
