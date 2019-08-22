const R = require('ramda')

const Validator = require('../validation/validator')

const validEmailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const errorKeys = {
  emailInvalid: 'user.validationErrors.emailInvalid',
  emailRequired: 'user.validationErrors.emailRequired',
  groupRequired: 'user.validationErrors.groupRequired',
  nameRequired: 'user.validationErrors.nameRequired',
}

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

const validateEmail = (propName, item) => {
  const email = getProp(propName)(item)
  return email && !validEmailRe.test(email) ? { key: errorKeys.emailInvalid } : null
}

const validateUser = async user => await Validator.validate(
  user,
  {
    'name': [Validator.validateRequired(errorKeys.nameRequired)],
    'email': [Validator.validateRequired(errorKeys.emailRequired), validateEmail],
    'groupUuid': [Validator.validateRequired(errorKeys.groupRequired)],
  })

const validateInvitation = async user => await Validator.validate(
  user,
  {
    'email': [Validator.validateRequired(errorKeys.emailRequired), validateEmail],
    'groupUuid': [Validator.validateRequired(errorKeys.groupRequired)],
  })

module.exports = {
  validateInvitation,
  validateUser,
}
