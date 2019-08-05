import React, { useRef } from 'react'
import { connect } from 'react-redux'

import { resetPassword, setLoginError } from './actions'

const LoginView = props => {

  const { resetPassword, setLoginError } = props

  const usernameRef = useRef()
  const newPasswordRef = useRef()
  const newPasswordConfirmRef = useRef()

  const reset = () => {
    const newPassword = newPasswordRef.current.value
    const newPasswordConfirm = newPasswordConfirmRef.current.value

    if (newPassword !== newPasswordConfirm) {
      setLoginError(`Passwords don't match.`)
    } else {
      const username = usernameRef.current.value
      resetPassword(newPassword, username)
    }
  }

  return (
    <div className="login-form">
      <input ref={usernameRef}
             type='text'
             name='username'
             className="login-form__input"
             placeholder='Choose your username' />

      <input ref={newPasswordRef}
             type='password'
             name='newPassword'
             className="login-form__input"
             placeholder='Your new password' />

      <input ref={newPasswordConfirmRef}
             type='password'
             name='newPasswordRepeat'
             className="login-form__input"
             placeholder='New password confirm' />

      <div className="login-form__buttons">
        <button type="button"
                className="btn btn-login"
                onClick={reset}>
          Reset password
        </button>
      </div>
    </div>
  )
}

export default connect(null, { resetPassword, setLoginError })(LoginView)
