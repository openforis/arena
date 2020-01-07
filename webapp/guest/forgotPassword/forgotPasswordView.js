import React from 'react'
import { connect } from 'react-redux'

import { useI18n, useFormObject } from '@webapp/commonComponents/hooks'

import * as LoginState from '../../login/loginState'
import { sendVerificationCode, setLoginError } from '../../login/actions'

import * as LoginValidator from '../../login/components/loginValidator'

const ForgotPasswordView = props => {
  const { email: initialEmail, sendVerificationCode, setLoginError } = props

  const i18n = useI18n()

  const { object: formObject, setObjectField, objectValid, validation } = useFormObject(
    {
      email: initialEmail,
    },
    LoginValidator.validateEmail,
    true,
  )

  const onSubmit = () => {
    if (objectValid) {
      sendVerificationCode(formObject.email)
    } else {
      setLoginError(LoginValidator.getFirstError(validation, ['email']))
    }
  }

  return (
    <>
      <input
        value={formObject.email}
        onChange={e => {
          setLoginError(null)
          setObjectField('email', e.target.value)
        }}
        type="text"
        name="username"
        placeholder={i18n.t('loginView.yourEmail')}
      />

      <div className="login-form__buttons">
        <button type="button" className="btn btn-login" onClick={onSubmit}>
          <span className="icon icon-envelop icon-12px icon-left" />
          {i18n.t('loginView.sendVerificationCode')}
        </button>
      </div>
    </>
  )
}

const mapStateToProps = state => ({
  email: LoginState.getEmail(state),
})

export default connect(mapStateToProps, {
  sendVerificationCode,
  setLoginError,
})(ForgotPasswordView)
