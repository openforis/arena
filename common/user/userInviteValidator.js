const R = require('ramda')

const { validate, validateRequired } = require('../validation/validator')
const { validateEmail } = require('./userValidator')

const errorKeys = {
  invalidEmail: 'invalidEmail'
}

const newUserPropsValidations = {
  'email': [validateRequired, validateEmail],
  'groupUuid': [validateRequired],
}

const validateNewUser = async user => await validate(user, newUserPropsValidations)

module.exports = {
  validateNewUser,
}
