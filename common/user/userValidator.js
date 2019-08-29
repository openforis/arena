const R = require('ramda')

const Validator = require('../validation/validator')
const ValidatorErrorKeys = require('../validation/validatorErrorKeys')

const validEmailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

const validateEmail = (propName, item) => {
  const email = getProp(propName)(item)
  return email && !validEmailRe.test(email) ? { key: ValidatorErrorKeys.user.emailInvalid } : null
}

const validateUser = async user => await Validator.validate(
  user,
  {
    'name': [Validator.validateRequired(ValidatorErrorKeys.nameRequired)],
    'email': [Validator.validateRequired(ValidatorErrorKeys.user.emailRequired), validateEmail],
    'groupUuid': [Validator.validateRequired(ValidatorErrorKeys.user.groupRequired)],
  })

const validateInvitation = async user => await Validator.validate(
  user,
  {
    'email': [Validator.validateRequired(ValidatorErrorKeys.user.emailRequired), validateEmail],
    'groupUuid': [Validator.validateRequired(ValidatorErrorKeys.user.groupRequired)],
  })

module.exports = {
  validateInvitation,
  validateUser,
}
