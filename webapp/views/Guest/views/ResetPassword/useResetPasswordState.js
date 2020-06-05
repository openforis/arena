import { useState, useEffect } from 'react'
import { useParams, useHistory } from 'react-router'
import { useDispatch } from 'react-redux'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { useAsyncGetRequest, useAsyncPutRequest, useOnUpdate } from '@webapp/components/hooks'

import { showNotification } from '@webapp/app/appNotification/actions'
import * as AppNotificationState from '@webapp/app/appNotification/appNotificationState'
import { appModuleUri } from '@webapp/app/appModules'

import * as LoginValidator from '@webapp/guest/login/loginValidator'

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
  }, [name, password, passwordConfirm])

  useOnUpdate(() => {
    history.push(appModuleUri())
    dispatch(showNotification('resetPasswordView.passwordSuccessfullyReset'))
  }, [resetComplete])

  // Check that reset password uuid is valid (user exists)
  useOnUpdate(() => {
    if (user) {
      setName(User.getName(user))
    } else {
      history.push(appModuleUri())
      dispatch(showNotification('resetPasswordView.forgotPasswordLinkInvalid', {}, AppNotificationState.severity.error))
    }
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
          : LoginValidator.getFirstError(validation, ['name', 'password', 'passwordConfirm'])
      )
    })()
  }

  const setFormField = (event) => {
    const handlerByName = {
      name: setName,
      password: setPassword,
      passwordConfirm: setPasswordConfirm,
    }

    const inputName = event.target.name
    const { value } = event.target
    if (handlerByName[inputName]) {
      handlerByName[inputName](value)
    }
  }

  return {
    user,
    resetPasswordState: { name, password, passwordConfirm },
    setFormField,
    error,
    onClickSetNewPassword,
  }
}
