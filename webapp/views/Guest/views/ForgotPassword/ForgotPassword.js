import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

import { EmailInput } from '@webapp/components/form'
import { useFormObject } from '@webapp/components/hooks'
import { LoginActions, LoginState, LoginValidator } from '@webapp/store/login'
import { useI18n } from '@webapp/store/system'
import Error from '@webapp/views/Guest/Error'

const ForgotPassword = () => {
  const initialEmail = useSelector(LoginState.getEmail)
  const error = useSelector(LoginState.getError)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()

  useEffect(() => {
    dispatch(LoginActions.setLoginError(null))

    return () => dispatch(LoginActions.setLoginError(null))
  }, [])

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
    true
  )

  const onSubmit = () => {
    if (objectValid) {
      dispatch(LoginActions.sendPasswordResetEmail(formObject.email, navigate))
    } else {
      dispatch(LoginActions.setLoginError(LoginValidator.getFirstError(validation, ['email'])))
    }
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} className="guest__form">
      <EmailInput
        value={formObject.email}
        onChange={(value) => {
          dispatch(LoginActions.setLoginError(null))
          setObjectField('email', value)
        }}
        name="username"
        label={i18n.t('loginView.yourEmail')}
      />

      <div className="guest__buttons">
        <button type="submit" className="btn" onClick={onSubmit}>
          <span className="icon icon-envelop icon-12px icon-left" />
          {i18n.t('loginView.sendPasswordResetEmail')}
        </button>
      </div>

      <Error error={error} />
    </form>
  )
}

export default ForgotPassword
