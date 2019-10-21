import * as R from 'ramda';
import Validator from '../validation/validator';
import Validation from '../validation/validation';

const validEmailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

const validateEmail = (propName, item) => {
  const email = getProp(propName, null)(item)
  return email && !validEmailRe.test(email) ? { key: Validation.messageKeys.user.emailInvalid } : null
}

const validateUser = async user => await Validator.validate(
  user,
  {
    'name': [Validator.validateRequired(Validation.messageKeys.nameRequired)],
    'email': [Validator.validateRequired(Validation.messageKeys.user.emailRequired), validateEmail],
    'groupUuid': [Validator.validateRequired(Validation.messageKeys.user.groupRequired)],
  })

const validateInvitation = async user => await Validator.validate(
  user,
  {
    'email': [Validator.validateRequired(Validation.messageKeys.user.emailRequired), validateEmail],
    'groupUuid': [Validator.validateRequired(Validation.messageKeys.user.groupRequired)],
  })

export default {
  validateEmail,
  validateInvitation,
  validateUser,
};
