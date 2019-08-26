import React from 'react'

import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { Input } from '../../commonComponents/form/input'

import * as LoginState from '../loginState'
import { setEmail, resetPassword, setLoginError } from '../actions'

import { useResetPasswordFormState } from './useResetPasswordFormState'

const ResetPasswordForm = props => {

  const {
    password, passwordConfirm, verificationCode,
    setPassword, setPasswordConfirm, setVerificationCode,
    onClickReset
  } = useResetPasswordFormState(props)

  const {
    email,
  } = props

  return (
    <div className='login-form'>
      <input value={email}
             readOnly={true}
             type='text'
             name='email'
             className="login-form__input"/>

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

      <Input value={verificationCode}
             onChange={setVerificationCode}
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
