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

const validateUser = async user => await validate(
  user,
  {
    'name': [validateRequired],
    'email': [validateRequired, validateEmail],
    'groupUuid': [validateRequired],
  })

const validateInvitation = async user => await validate(
  user,
  {
    'email': [validateRequired, validateEmail],
    'groupUuid': [validateRequired],
  })

module.exports = {
  validateInvitation,
  validateUser,
}
