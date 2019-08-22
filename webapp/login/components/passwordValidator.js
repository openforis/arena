const R = require('ramda')

const errorKeys = {
  requiredField: 'requiredField',
  invalidPassword: 'invalidPassword',
  unsafePassword: 'unsafePassword',
  passwordsDoNotMatch: `passwordsDoNotMatch`
}

export const errors = {
  password: {
    [errorKeys.requiredField]: 'Please enter a new password',
    [errorKeys.invalidPassword]: 'Password should not start nor end with white spaces',
    [errorKeys.unsafePassword]: 'Password should be at least 8 characters long and contain lowercase characters, uppercase characters and numbers',
  },
  passwordConfirm: {
    [errorKeys.passwordsDoNotMatch]: `Passwords don't match`
  }
}

const validPasswordRe = new RegExp(/^[\S]+.*[\S]+$/)
const strongPasswordRe = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/)

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

export const validatePassword = (propName, item) => {
  const password = getProp(propName)(item)
  return !validPasswordRe.test(password) ? { key: errorKeys.invalidPassword } : null
}

export const validatePasswordStrength = (propName, item) => {
  const password = getProp(propName)(item)
  return !strongPasswordRe.test(password) ? { key: errorKeys.unsafePassword } : null
}

export const validatePasswordConfirm = (propName, item) => {
  const password = item.password
  const passwordConfirm = getProp(propName)(item)
  return password !== passwordConfirm ? { key: errorKeys.passwordsDoNotMatch } : null
}
