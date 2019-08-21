import React, { useRef } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import * as LoginState from './loginState'
import { setEmail, resetPassword, setLoginError } from './actions'

const ResetPasswordForm = props => {

  const {
    email,
    resetPassword, setLoginError,
  } = props

  const newPasswordRef = useRef(null)
  const newPasswordConfirmRef = useRef(null)
  const verificationCodeRef = useRef(null)

  const onClickReset = () => {
    const newPassword = newPasswordRef.current.value
    const newPasswordConfirm = newPasswordConfirmRef.current.value
    const verificationCode = verificationCodeRef.current.value

    if (newPassword !== newPasswordConfirm) {
      setLoginError(`Passwords don't match`)
    } else {
      resetPassword(verificationCode, newPassword)
    }
  }

  return (
    <div className='login-form'>
      <input value={email}
             readOnly={true}
             type='text'
             name='email'
             className="login-form__input"/>

      <input ref={newPasswordRef}
             type='password'
             name='newPassword'
             className="login-form__input"
             placeholder='Your new Password'/>

      <input ref={newPasswordConfirmRef}
             type='password'
             name='newPasswordRepeat'
             className="login-form__input"
             placeholder='Repeat your new Password'/>

      <input ref={verificationCodeRef}
             type='text'
             name='verificationCode'
             className="login-form__input"
             placeholder='Verification code'/>

      <div className="login-form__buttons">
        <button type="button"
                className="btn btn-login"
                onClick={onClickReset}>
          Reset password
        </button>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  email: LoginState.getEmail(state),
})

const enhance = compose(
  withRouter,
  connect(
    mapStateToProps,
    { setEmail, resetPassword, setLoginError }
  )
)

export default enhance(ResetPasswordForm)
