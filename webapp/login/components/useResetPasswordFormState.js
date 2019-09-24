import React from 'react'

import { useFormObject } from '../../commonComponents/hooks'

import { validateResetPasswordObj, getFirstError } from './loginValidator'

export const useResetPasswordFormState = props => {
  const {
    setLoginError,
    resetPassword,
  } = props

  const {
    object: formObject,
    setObjectField,
    objectValid,
    validation,
  } = useFormObject({
    password: '',
    passwordConfirm: '',
    verificationCode: '',
  }, validateResetPasswordObj, true)

  const password = formObject.password
  const passwordConfirm = formObject.passwordConfirm
  const verificationCode = formObject.verificationCode

  const onClickReset = () => {
    if (objectValid) {
      resetPassword(verificationCode, password)
    } else {
      setLoginError(getFirstError(validation, ['password', 'passwordConfirm', 'verificationCode']))
    }
  }

  return {
    password: password,
    setPassword: password => setObjectField('password', password),
    passwordConfirm: passwordConfirm,
    setPasswordConfirm: password => setObjectField('passwordConfirm', password),
    verificationCode: verificationCode,
    setVerificationCode: verificationCode => setObjectField('verificationCode', verificationCode),
    onClickReset,
  }
}
