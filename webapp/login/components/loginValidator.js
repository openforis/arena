import * as R from 'ramda'

import Validator from '../../../common/validation/validator'
import UserValidator from '../../../common/user/userValidator'
import ValidatorErrorKeys from '../../../common/validation/validatorErrorKeys'

const validPasswordRe = new RegExp(/^[\S]+.*[\S]+$/)
const passwordStrengthRe = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/)

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

const _validatePassword = (propName, item) => {
  const password = getProp(propName)(item)
  return !validPasswordRe.test(password) ? { key: ValidatorErrorKeys.user.passwordInvalid } : null
}

const _validatePasswordStrength = (propName, item) => {
  const password = getProp(propName)(item)
  return !passwordStrengthRe.test(password) ? { key: ValidatorErrorKeys.user.passwordUnsafe } : null
}

const _validatePasswordConfirm = (propName, item) => {
  const password = item.password
  const passwordConfirm = getProp(propName)(item)
  return password !== passwordConfirm ? { key: ValidatorErrorKeys.user.passwordsDoNotMatch } : null
}

const _validateVerificationCode = (propName, item) => {
  const verificationCodeRe = new RegExp(/^[\S]+$/)
  const verificationCode = item[propName]
  return !verificationCodeRe.test(verificationCode) ? { key: ValidatorErrorKeys.user.CodeMismatchException } : null
}


export const validateResetPasswordObj = async obj => await Validator.validate(
  obj,
  {
    'password': [Validator.validateRequired(ValidatorErrorKeys.user.passwordRequired), _validatePassword, _validatePasswordStrength],
    'passwordConfirm': [_validatePasswordConfirm],
    'verificationCode': [_validateVerificationCode],
  })

export const validateAcceptInvitationObj = async obj => await Validator.validate(
  obj,
  {
    'userName': [Validator.validateRequired(ValidatorErrorKeys.user.userNameRequired)],
    'passwordConfirm': [_validatePasswordConfirm],
    'password': [Validator.validateRequired(ValidatorErrorKeys.user.passwordRequired), _validatePassword, _validatePasswordStrength],
  })

export const validateLoginObj = async obj => await Validator.validate(
  obj,
  {
    'email': [Validator.validateRequired(ValidatorErrorKeys.user.emailRequired), UserValidator.validateEmail],
    'password': [Validator.validateRequired(ValidatorErrorKeys.user.passwordRequired)]
  }
)

export const validateEmail = async obj => await Validator.validate(
  obj,
  {
    'email': [Validator.validateRequired(ValidatorErrorKeys.user.emailRequired), UserValidator.validateEmail]
  }
)

export const getFirstError = (validation, order) => {
  const firstMatch = order.map(field => Validator.getFieldValidation(field)(validation))
    .find(v => !Validator.isValidationValid(v))
  return Validator.getErrors(firstMatch)[0].key
}
