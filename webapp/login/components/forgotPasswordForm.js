import React from 'react'
import { connect } from 'react-redux'

import { useI18n, useFormObject } from '@webapp/commonComponents/hooks'

import * as LoginState from '../loginState'
import { sendVerificationCode, setLoginError } from '../actions'

import * as LoginValidator from './loginValidator'

const ForgotPasswordForm = props => {
  const { email: initialEmail, sendVerificationCode, setLoginError } = props

  const i18n = useI18n()

  const {
    object: formObject,
    setObjectField,
    objectValid,
    validation,
  } = useFormObject(
    {
      email: initialEmail,
    },
    LoginValidator.validateEmail,
    true,
  )

  const onClickReset = () => {
    if (objectValid) {
      sendVerificationCode(formObject.email)
    } else {
      setLoginError(LoginValidator.getFirstError(validation, ['email']))
    }
  }

  return (
    <div className="login-form">
      <input
        value={formObject.email}
        onChange={e => setObjectField('email', e.target.value)}
        type="text"
        name="username"
        className="login-form__input"
        placeholder={i18n.t('loginView.yourEmail')}
      />

      <div className="login-form__buttons">
        <button type="button" className="btn btn-login" onClick={onClickReset}>
          <span className="icon icon-envelop icon-12px icon-left" />
          {i18n.t('loginView.sendVerificationCode')}
        </button>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  email: LoginState.getEmail(state),
})

export default connect(mapStateToProps, {
  sendVerificationCode,
  setLoginError,
})(ForgotPasswordForm)
