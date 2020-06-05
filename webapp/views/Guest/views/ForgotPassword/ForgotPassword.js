import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router'

import { useI18n, useFormObject } from '@webapp/components/hooks'
import Error from '@webapp/views/Guest/components/Error'

import * as LoginState from '@webapp/guest/login/loginState'
import * as LoginValidator from '@webapp/guest/login/loginValidator'
import { sendPasswordResetEmail, setLoginError } from '@webapp/guest/login/actions'

const ForgotPassword = () => {
  const initialEmail = useSelector(LoginState.getEmail)
  const error = useSelector(LoginState.getError)
  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()

  useEffect(() => {
    dispatch(setLoginError(null))

    return () => dispatch(setLoginError(null))
  }, [])

  const { object: formObject, setObjectField, objectValid, validation } = useFormObject(
    {
      email: initialEmail,
    },
    LoginValidator.validateEmail,
    true
  )

  const onSubmit = () => {
    if (objectValid) {
      dispatch(sendPasswordResetEmail(formObject.email, history))
    } else {
      dispatch(setLoginError(LoginValidator.getFirstError(validation, ['email'])))
    }
  }

  return (
    <>
      <input
        value={formObject.email}
        onChange={(event) => {
          dispatch(setLoginError(null))
          setObjectField('email', event.target.value)
        }}
        type="text"
        name="username"
        placeholder={i18n.t('loginView.yourEmail')}
      />

      <div className="guest__buttons">
        <button type="submit" className="btn" onClick={onSubmit}>
          <span className="icon icon-envelop icon-12px icon-left" />
          {i18n.t('loginView.sendPasswordResetEmail')}
        </button>
      </div>

      <Error error={error} />
    </>
  )
}

export default ForgotPassword
