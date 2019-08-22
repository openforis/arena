import React from 'react'

import useFormObject from '../../commonComponents/hooks/useFormObject'
import { validate, validateRequired, isValidationValid } from '../../../common/validation/validator'

import { validatePassword, validatePasswordStrength, validatePasswordConfirm, errors } from './passwordValidator'

export const useResetPasswordFormState = props => {
  const {
    setLoginError,
    resetPassword,
  } = props

  const formErrors = {
    ...errors,
    verificationCode: {
      invalidVerificationCode: 'Please enter a valid verification code',
    }
  }

  const validateVerificationCode = (propName, item) => {
    const verificationCodeRe = new RegExp(/^[\S]+$/)
    const verificationCode = item[propName]
    return !verificationCodeRe.test(verificationCode) ? { key: 'invalidVerificationCode' } : null
  }

  const validateObj = async obj => await validate(
    obj,
    {
      'passwordConfirm': [validatePasswordConfirm],
      'password': [validateRequired, validatePassword, validatePasswordStrength],
      'verificationCode': [validateVerificationCode],
    })

  const {
    object: formObject,
    setObjectField,
    objectValid,
    getFieldValidation,
  } = useFormObject({
    password: '',
    passwordConfirm: '',
    verificationCode: '',
  }, validateObj, true)

  const onClickReset = () => {
    if (objectValid) {
      resetPassword(formObject.verificationCode, formObject.password)
    } else {
      const firstMatch = ['passwordConfirm', 'password', 'verificationCode']
        .map(field => ({ field, validation: getFieldValidation(field) }))
        .find(v => !isValidationValid(v.validation))
      const key = firstMatch.validation.errors[0].key
      setLoginError(formErrors[firstMatch.field][key])
    }
  }

  return {
    password: formObject.password,
    setPassword: password => setObjectField('password', password),
    passwordConfirm: formObject.passwordConfirm,
    setPasswordConfirm: password => setObjectField('passwordConfirm', password),
    verificationCode: formObject.verificationCode,
    setVerificationCode: verificationCode => setObjectField('verificationCode', verificationCode),
    onClickReset,
  }
}
