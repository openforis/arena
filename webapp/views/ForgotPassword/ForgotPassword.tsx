import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

import * as ProcessUtils from '@core/processUtils'
import { Button } from '@webapp/components'
import { EmailInput } from '@webapp/components/form'
import GuestError from '@webapp/components/guest/GuestError'
import { GuestViewHeader } from '@webapp/components/guest/GuestViewHeader'
import { useFormObject } from '@webapp/components/hooks'
import { ReCaptcha } from '@webapp/components/ReCaptcha'
import { useAppDispatch } from '@webapp/store'
import { LoginActions, LoginState, LoginValidator } from '@webapp/store/login'

const ForgotPassword = () => {
  const initialEmail = useSelector(LoginState.getEmail)
  const error = useSelector(LoginState.getError)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const reCaptchaRef = useRef(null)

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

  const onSubmit = async () => {
    if (!objectValid) {
      dispatch(LoginActions.setLoginError(LoginValidator.getFirstError(validation, ['email'])))
      return
    }
    const reCaptchaToken = reCaptchaRef.current?.getValue()
    if (ProcessUtils.ENV.reCaptchaEnabled && !reCaptchaToken) {
      dispatch(LoginActions.setLoginError('guest:accessRequestView.reCaptchaNotAnswered'))
      return
    }
    await dispatch(LoginActions.sendPasswordResetEmail({ email: formObject.email, reCaptchaToken, navigate }))
    // a token can be verified only once
    reCaptchaRef.current?.reset()
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} className="guest__form">
      <GuestViewHeader
        backToLogin
        description="guest:forgotPasswordView.description"
        icon="key"
        title="guest:forgotPasswordView.title"
      />
      <GuestError error={error} />
      <EmailInput
        autoComplete="username"
        value={formObject.email}
        onChange={(value) => {
          dispatch(LoginActions.setLoginError(null))
          setObjectField('email', value)
        }}
        name="username"
        label="guest:loginView.yourEmail"
      />

      <ReCaptcha ref={reCaptchaRef} />

      <Button
        className="guest__submit"
        label="guest:loginView.sendPasswordResetEmail"
        onClick={onSubmit}
        type="submit"
      />
    </form>
  )
}

export default ForgotPassword
