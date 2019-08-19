import React, { useRef, useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { resetPassword, setLoginError } from './actions'

const ResetPasswordForm = props => {

  const {
    username, verificationCode,
    resetPassword, setLoginError,
  } = props

  const newPasswordRef = useRef(null)
  const newPasswordConfirmRef = useRef(null)

  const onClickReset = () => {
    const newPassword = newPasswordRef.current.value
    const newPasswordConfirm = newPasswordConfirmRef.current.value

    if (newPassword !== newPasswordConfirm) {
      setLoginError(`Passwords don't match`)
    } else {
      resetPassword(username, verificationCode, newPassword)
    }
  }

  useEffect(() => {
  }, [username, verificationCode])

  return (
    <div className='login-form'>
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
const mapStateToProps = (_, { location }) => {
  const urlSearchParams = new URLSearchParams(location.search)

  return {
    username: urlSearchParams.get('username'),
    verificationCode: urlSearchParams.get('verificationCode'),
  }
}

const enhance = compose(
  withRouter,
  connect(
    mapStateToProps,
    { resetPassword, setLoginError }
  )
)

export default enhance(ResetPasswordForm)
