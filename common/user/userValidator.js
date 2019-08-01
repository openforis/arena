const R = require('ramda')

const {validate, validateRequired } = require('../validation/validator')

const User = require('../../common/user/user')

const errorKeys = {
  invalidEmail: 'invalidEmail'
}

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

const validateEmail = (propName, item) => {
  const email = getProp(propName)(item)
  return email && !User.validEmail(email) ? { key: errorKeys.invalidEmail } : null
}

const newUserPropsValidations = {
  'email': [validateRequired, validateEmail],
  'groupId': [validateRequired],
}

const validateNewUser = async user =>
  validate(user, newUserPropsValidations)

module.exports = {
  validateNewUser,
  validateEmail,
}
