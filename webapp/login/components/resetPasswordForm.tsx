import React from 'react'

import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { useI18n } from '../../commonComponents/hooks'

import * as LoginState from '../loginState'
import { resetPassword, setLoginError } from '../actions'

import { useResetPasswordFormState } from './useResetPasswordFormState'

const ResetPasswordForm = props => {

  const { email } = props

  const i18n = useI18n()

  const {
    password, passwordConfirm, verificationCode,
    setPassword, setPasswordConfirm, setVerificationCode,
    onClickReset
  } = useResetPasswordFormState(props)

  return (
    <div className='login-form'>
      <input value={email}
             readOnly={true}
             type='text'
             name='email'
             className="login-form__input"/>

      <input value={password}
             onChange={e => setPassword(e.target.value)}
             type='password'
             name='newPassword'
             className="login-form__input"
             placeholder={i18n.t('loginView.yourNewPassword')}/>

      <input value={passwordConfirm}
             onChange={e => setPasswordConfirm(e.target.value)}
             type='password'
             name='newPasswordRepeat'
             className="login-form__input"
             placeholder={i18n.t('loginView.repeatYourNewPassword')}/>

      <input value={verificationCode}
             onChange={e => setVerificationCode(e.target.value)}
             type='text'
             name='verificationCode'
             className="login-form__input"
             placeholder={i18n.t('loginView.verificationCode')} />

      <div className="login-form__buttons">
        <button type="button"
                className="btn btn-login"
                onClick={onClickReset}>
          {i18n.t('loginView.resetPassword')}
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
    { resetPassword, setLoginError }
  )
)

export default enhance(ResetPasswordForm)
