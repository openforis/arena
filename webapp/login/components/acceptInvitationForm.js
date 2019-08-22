import React from 'react'
import { connect } from 'react-redux'

import { Input } from '../../commonComponents/form/input'

import { acceptInvitation, setLoginError } from '../actions'
import { useAcceptInvitationFormState } from './useAcceptInvitationFormState';

const AcceptInvitationForm = props => {

  const {
    userName, password, passwordConfirm,
    setUserName, setPassword, setPasswordConfirm,
    onClickReset,
  } = useAcceptInvitationFormState(props)

  return (
    <div className="login-form">
      <Input value={userName}
             onChange={setUserName}
             type='text'
             name='name'
             className="login-form__input"
             placeholder='Your Name'/>

      <Input value={password}
             onChange={setPassword}
             type='password'
             name='newPassword'
             className="login-form__input"
             placeholder='Your new Password'/>

      <Input value={passwordConfirm}
             onChange={setPasswordConfirm}
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

export default connect(null, {
  acceptInvitation,
  setLoginError
})(AcceptInvitationForm)
