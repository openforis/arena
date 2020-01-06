import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { useAsyncGetRequest, useAsyncPostRequest } from '@webapp/commonComponents/hooks'
import * as LoginValidator from '@webapp/login/components/loginValidator'

export const useResetPasswordState = () => {
  const { uuid } = useParams()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [validation, setValidation] = useState()

  const { data: { user } = {}, dispatch: dispatchGetResetPassword } = useAsyncGetRequest(`/auth/reset-password/${uuid}`)

  const {
    data: { result: resetComplete = false } = {},
    dispatch: dispatchPostResetPassword,
  } = useAsyncPostRequest(`/auth/reset-password/${uuid}`, { password })

  useEffect(() => {
    dispatchGetResetPassword()
  }, [])

  // Validate password and passwordConfirm on change
  const validate = async () => {
    setValidation(await LoginValidator.validateResetPasswordObj({ password, passwordConfirm }))
  }

  useEffect(() => {
    validate()
  }, [password, passwordConfirm])

  const onClickSetNewPassword = () => {
    dispatchPostResetPassword()
  }

  return {
    user,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    validation,
    onClickSetNewPassword,
    resetComplete,
  }
}
