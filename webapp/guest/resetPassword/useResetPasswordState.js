import { useState, useEffect } from 'react'
import { useParams, useHistory } from 'react-router'
import { useDispatch } from 'react-redux'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { useAsyncGetRequest, useAsyncPutRequest, useOnUpdate } from '@webapp/commonComponents/hooks'
import { showNotification } from '@webapp/app/appNotification/actions'
import * as LoginValidator from '@webapp/guest/login/loginValidator'
import { appModuleUri, appModules } from '@webapp/app/appModules'

export const useResetPasswordState = () => {
  const { uuid } = useParams()
  const history = useHistory()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState()

  const dispatch = useDispatch()

  const { data: { user } = {}, dispatch: getResetPasswordUser } = useAsyncGetRequest(`/auth/reset-password/${uuid}`)

  const {
    data: { result: resetComplete = false } = {},
    dispatch: dispatchPostResetPassword,
  } = useAsyncPutRequest(`/auth/reset-password/${uuid}`, { name, password })

  useEffect(() => {
    getResetPasswordUser()
  }, [])

  useEffect(() => {
    setError(null)
  }, [password, passwordConfirm])

  useOnUpdate(() => {
    history.push(appModuleUri(appModules.home))
    dispatch(showNotification('resetPasswordView.passwordSuccessfullyReset'))
  }, [resetComplete])

  // Check that reset password uuid is valid (user exists)
  useOnUpdate(() => {
    if (user) setName(User.getName(user))
    else setError('resetPasswordView.forgotPasswordLinkInvalid')
  }, [user])

  const onClickSetNewPassword = () => {
    ;(async () => {
      const validation = await LoginValidator.validateResetPasswordObj({ name, password, passwordConfirm })
      if (Validation.isValid(validation)) {
        dispatchPostResetPassword()
      }

      setError(
        Validation.isValid(validation)
          ? null
          : LoginValidator.getFirstError(validation, ['name', 'password', 'passwordConfirm']),
      )
    })()
  }

  return {
    user,
    name,
    setName,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    error,
    onClickSetNewPassword,
  }
}
