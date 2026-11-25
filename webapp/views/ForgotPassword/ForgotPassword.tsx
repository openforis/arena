import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

import { useFormObject } from '@webapp/components/hooks'
import { EmailInput } from '@webapp/components/form'

import { Button } from '@webapp/components'
import GuestError from '@webapp/components/guest/GuestError'
import { GuestViewHeader } from '@webapp/components/guest/GuestViewHeader'

import { LoginState, LoginValidator, LoginActions } from '@webapp/store/login'
import { useAppDispatch } from '@webapp/store'

const ForgotPassword = () => {
  const initialEmail = useSelector(LoginState.getEmail)
  const error = useSelector(LoginState.getError)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

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
      <GuestViewHeader
        backToLogin
        description="guest:forgotPasswordView.description"
        icon="icon-key"
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
