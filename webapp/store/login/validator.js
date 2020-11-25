import * as R from 'ramda'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as UserValidator from '@core/user/userValidator'
import * as User from '@core/user/user'

const validPasswordRe = new RegExp(/^[\S]+.*[\S]+$/)
const passwordStrengthRe = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d).{8,}$/)

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

const _validatePassword = (propName, item) => {
  const password = getProp(propName)(item)

  if (!validPasswordRe.test(password)) {
    return { key: Validation.messageKeys.user.passwordInvalid }
  }

  if (!passwordStrengthRe.test(password)) {
    return { key: Validation.messageKeys.user.passwordUnsafe }
  }

  return null
}

const _validatePasswordConfirm = (propName, item) => {
  const { password } = item
  const passwordConfirm = getProp(propName)(item)
  return password !== passwordConfirm ? { key: Validation.messageKeys.user.passwordsDoNotMatch } : null
}

export const validateLoginObj = async (obj) =>
  Validator.validate(obj, {
    email: [Validator.validateRequired(Validation.messageKeys.user.emailRequired), UserValidator.validateEmail],
    password: [Validator.validateRequired(Validation.messageKeys.user.passwordRequired)],
  })

export const validateEmail = async (obj) =>
  Validator.validate(obj, {
    email: [Validator.validateRequired(Validation.messageKeys.user.emailRequired), UserValidator.validateEmail],
  })

export const validateResetPasswordObj = async (obj) =>
  Validator.validate(obj, {
    [`${User.keys.props}.${User.keysProps.title}`]: [
      Validator.validateRequired(Validation.messageKeys.user.titleRequired),
    ],
    name: [Validator.validateRequired(Validation.messageKeys.user.nameRequired)],
    password: [Validator.validateRequired(Validation.messageKeys.user.passwordRequired), _validatePassword],
    passwordConfirm: [_validatePasswordConfirm],
  })

export const getFirstError = (validation, order) =>
  R.pipe(
    R.map((field) => Validation.getFieldValidation(field)(validation)),
    R.find(Validation.isNotValid),
    Validation.getErrors,
    R.head,
    ValidationResult.getKey
  )(order)
