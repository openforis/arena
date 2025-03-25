import * as R from 'ramda'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as UserValidator from '@core/user/userValidator'
import * as User from '@core/user/user'
import { UserPasswordValidator } from '@core/user/userPasswordValidator'

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

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

export const validateResetPasswordObj = async (obj) => {
  const propsValidations = {
    password: [
      Validator.validateRequired(Validation.messageKeys.user.passwordRequired),
      UserPasswordValidator.validatePassword,
    ],
    passwordConfirm: [_validatePasswordConfirm],
  }
  if (!obj.hasAlreadyAccepted) {
    Object.assign(propsValidations, {
      [User.keysProps.title]: [Validator.validateRequired(Validation.messageKeys.user.titleRequired)],
      name: [Validator.validateRequired(Validation.messageKeys.user.nameRequired)],
    })
  }
  return Validator.validate(obj, propsValidations)
}

export const getFirstError = (validation, order) =>
  R.pipe(
    R.map((field) => Validation.getFieldValidation(field)(validation)),
    R.find(Validation.isNotValid),
    Validation.getErrors,
    R.head,
    ValidationResult.getKey
  )(order)
