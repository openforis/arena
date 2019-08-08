const R = require('ramda')

const { validate, validateRequired } = require('../validation/validator')

const errorKeys = {
  invalidEmail: 'invalidEmail'
}

const validEmailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

const validateEmail = (propName, item) => {
  const email = getProp(propName)(item)
  return email && !validEmailRe.test(email) ? { key: errorKeys.invalidEmail } : null
}

const newUserPropsValidations = {
  'email': [validateRequired, validateEmail],
  'groupId': [validateRequired],
}

const validateNewUser = async user => await validate(user, newUserPropsValidations)

module.exports = {
  validateNewUser,
  validateEmail,
}
