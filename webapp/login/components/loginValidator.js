import * as R from 'ramda'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as UserValidator from '@core/user/userValidator'

const validPasswordRe = new RegExp(/^[\S]+.*[\S]+$/)
const passwordStrengthRe = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d).{8,}$/)

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

const _validatePassword = (propName, item) => {
  const password = getProp(propName)(item)
  return !validPasswordRe.test(password) ? { key: Validation.messageKeys.user.passwordInvalid } : null
}

const _validatePasswordStrength = (propName, item) => {
  const password = getProp(propName)(item)
  return !passwordStrengthRe.test(password) ? { key: Validation.messageKeys.user.passwordUnsafe } : null
}

const _validatePasswordConfirm = (propName, item) => {
  const password = item.password
  const passwordConfirm = getProp(propName)(item)
  return password !== passwordConfirm ? { key: Validation.messageKeys.user.passwordsDoNotMatch } : null
}

const _validateVerificationCode = (propName, item) => {
  const verificationCodeRe = new RegExp(/^[\S]+$/)
  const verificationCode = item[propName]
  return !verificationCodeRe.test(verificationCode) ? { key: Validation.messageKeys.user.CodeMismatchException } : null
}

export const validateResetPasswordObj = async obj =>
  await Validator.validate(obj, {
    password: [
      Validator.validateRequired(Validation.messageKeys.user.passwordRequired),
      _validatePassword,
      _validatePasswordStrength,
    ],
    passwordConfirm: [_validatePasswordConfirm],
    verificationCode: [_validateVerificationCode],
  })

export const validateAcceptInvitationObj = async obj =>
  await Validator.validate(obj, {
    userName: [Validator.validateRequired(Validation.messageKeys.user.userNameRequired)],
    passwordConfirm: [_validatePasswordConfirm],
    password: [
      Validator.validateRequired(Validation.messageKeys.user.passwordRequired),
      _validatePassword,
      _validatePasswordStrength,
    ],
  })

export const validateLoginObj = async obj =>
  await Validator.validate(obj, {
    email: [Validator.validateRequired(Validation.messageKeys.user.emailRequired), UserValidator.validateEmail],
    password: [Validator.validateRequired(Validation.messageKeys.user.passwordRequired)],
  })

export const validateEmail = async obj =>
  await Validator.validate(obj, {
    email: [Validator.validateRequired(Validation.messageKeys.user.emailRequired), UserValidator.validateEmail],
  })

export const getFirstError = (validation, order) => {
  const firstMatch = order
    .map(field => Validation.getFieldValidation(field)(validation))
    .find(v => !Validation.isValid(v))
  return Validation.getErrors(firstMatch)[0].key
}
