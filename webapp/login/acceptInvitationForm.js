import React, { useRef } from 'react'
import { connect } from 'react-redux'

import { acceptInvitation, setLoginError } from './actions'

const AcceptInvitationForm = props => {

  const { acceptInvitation, setLoginError } = props

  const nameRef = useRef(null)
  const newPasswordRef = useRef(null)
  const newPasswordConfirmRef = useRef(null)

  const onClickReset = () => {
    const newPassword = newPasswordRef.current.value
    const newPasswordConfirm = newPasswordConfirmRef.current.value

    if (newPassword !== newPasswordConfirm) {
      setLoginError(`Passwords don't match`)
    } else {
      const name = nameRef.current.value
      acceptInvitation(name, newPassword)
    }
  }

  return (
    <div className="login-form">
      <input ref={nameRef}
             type='text'
             name='username'
             className="login-form__input"
             placeholder='Your Name'/>

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

export default connect(null, { acceptInvitation, setLoginError })(AcceptInvitationForm)
