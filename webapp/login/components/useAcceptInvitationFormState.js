import React from 'react'

import useFormObject from '../../commonComponents/hooks/useFormObject'
import Validator from '../../../common/validation/validator'

import { validatePassword, validatePasswordStrength, validatePasswordConfirm, errors } from './passwordValidator'

export const useAcceptInvitationFormState = props => {
  const { acceptInvitation, setLoginError } = props

  const formErrors = {
    ...errors,
    userName: {
      requiredField: 'Please enter a new name',
    }
  }

  const validateObj = async obj => await Validator.validate(
    obj,
    {
      'userName': [Validator.validateRequired],
      'password': [Validator.validateRequired, validatePassword, validatePasswordStrength],
      'passwordConfirm': [validatePasswordConfirm],
    })

  const {
    object: formObject,
    setObjectField,
    objectValid,
    getFieldValidation,
  } = useFormObject({
    userName: '',
    password: '',
    passwordConfirm: '',
  }, validateObj, true)

  const userName = formObject.userName
  const password = formObject.password
  const passwordConfirm = formObject.passwordConfirm

  const onClickReset = () => {
    if (objectValid) {
      acceptInvitation(userName, password)
    } else {
      const firstMatch = ['userName', 'passwordConfirm', 'password']
        .map(field => ({ field, validation: getFieldValidation(field) }))
        .find(v => !Validator.isValidationValid(v.validation))
      const key = firstMatch.validation.errors[0].key
      setLoginError(formErrors[firstMatch.field][key])
    }
  }

  return {
    userName,
    setUserName: userName => setObjectField('userName', userName),
    password,
    setPassword: password => setObjectField('password', password),
    passwordConfirm,
    setPasswordConfirm: password => setObjectField('passwordConfirm', password),
    onClickReset,
  }
}
