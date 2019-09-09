import React from 'react'

import useFormObject from '../../commonComponents/hooks/useFormObject'
import Validator from '../../../common/validation/validator'
import ValidatorErrorKeys from '../../../common/validation/validatorErrorKeys'

import { validatePassword, validatePasswordStrength, validatePasswordConfirm } from './passwordValidator'

export const useResetPasswordFormState = props => {
  const {
    setLoginError,
    resetPassword,
  } = props

  const validateVerificationCode = (propName, item) => {
    const verificationCodeRe = new RegExp(/^[\S]+$/)
    const verificationCode = item[propName]
    return !verificationCodeRe.test(verificationCode) ? { key: ValidatorErrorKeys.user.verificationCodeInvalid } : null
  }

  const validateObj = async obj => await Validator.validate(
    obj,
    {
      'password': [Validator.validateRequired(ValidatorErrorKeys.user.passwordRequired), validatePassword, validatePasswordStrength],
      'passwordConfirm': [validatePasswordConfirm],
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

  const password = formObject.password
  const passwordConfirm = formObject.passwordConfirm
  const verificationCode = formObject.verificationCode

  const onClickReset = () => {
    if (objectValid) {
      resetPassword(verificationCode, password)
    } else {
      const firstMatch = ['passwordConfirm', 'password', 'verificationCode']
        .map(field => ({ field, validation: getFieldValidation(field) }))
        .find(v => !Validator.isValidationValid(v.validation))
      setLoginError(firstMatch.validation.errors[0].key)
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
