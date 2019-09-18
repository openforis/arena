const R = require('ramda')

const Validator = require('../validation/validator')

const validEmailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

const validateEmail = (propName, item) => {
  const email = getProp(propName)(item)
  return email && !validEmailRe.test(email) ? { key: Validator.messageKeys.user.emailInvalid } : null
}

const validateUser = async user => await Validator.validate(
  user,
  {
    'name': [Validator.validateRequired(Validator.messageKeys.nameRequired)],
    'email': [Validator.validateRequired(Validator.messageKeys.user.emailRequired), validateEmail],
    'groupUuid': [Validator.validateRequired(Validator.messageKeys.user.groupRequired)],
  })

const validateInvitation = async user => await Validator.validate(
  user,
  {
    'email': [Validator.validateRequired(Validator.messageKeys.user.emailRequired), validateEmail],
    'groupUuid': [Validator.validateRequired(Validator.messageKeys.user.groupRequired)],
  })

module.exports = {
  validateEmail,
  validateInvitation,
  validateUser,
}
