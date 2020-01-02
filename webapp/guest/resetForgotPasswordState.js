import { useState, useEffect } from 'react'

import { useAsyncGetRequest } from '@webapp/commonComponents/hooks'
import { useParams } from 'react-router-dom'

export const useResetForgotPasswordState = props => {
  const { uuid } = useParams()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const { data: { user } = {}, dispatch: dispatchGetResetPassword } = useAsyncGetRequest(`/auth/reset-password/${uuid}`)

  useEffect(() => {
    dispatchGetResetPassword()
  }, [])

  const onClickSetNewPassword = () => {
    return false
  }

  return {
    user,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    onClickSetNewPassword,
  }
}
