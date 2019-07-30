const R = require('ramda')

const {validate, validateRequired } = require('../validation/validator')

const User = require('../../common/user/user')

const errorKeys = {
  invalidEmail: 'invalidEmail'
}

// const UserRepository = require('../../server/modules/user/repository/userRepository')

// const validateUserEmailUniqueness = async (propName, user) => {
//   const email = R.path(propName.split('.'))(user)
//   const userByEmail = await UserRepository.fetchUserByEmail(email)
//
//   return !R.isEmpty(userByEmail) && R.find(s => s.id !== survey.id, userByName)
//     ? { key: errorKeys.duplicate }
//     : null
// }

// const surveyInfoPropsValidations = {
//   'props.name': [validateRequired, validateNotKeyword, validateSurveyNameUniqueness],
//   'props.languages': [validateRequired],
//   'props.srs': [validateRequired],
// }

// const validateSurveyInfo = async surveyInfo =>
//   await validate(surveyInfo, surveyInfoPropsValidations)

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
