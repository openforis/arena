import * as R from 'ramda'

import ValidatorErrorKeys from '../../../common/validation/validatorErrorKeys'

const validPasswordRe = new RegExp(/^[\S]+.*[\S]+$/)
const passwordStrengthRe = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/)

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

export const validatePassword = (propName, item) => {
  const password = getProp(propName)(item)
  return !validPasswordRe.test(password) ? { key: ValidatorErrorKeys.user.passwordInvalid } : null
}

export const validatePasswordStrength = (propName, item) => {
  const password = getProp(propName)(item)
  return !passwordStrengthRe.test(password) ? { key: ValidatorErrorKeys.user.passwordUnsafe } : null
}

export const validatePasswordConfirm = (propName, item) => {
  const password = item.password
  const passwordConfirm = getProp(propName)(item)
  return password !== passwordConfirm ? { key: ValidatorErrorKeys.user.passwordsDoNotMatch } : null
}
