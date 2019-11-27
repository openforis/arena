import * as R from 'ramda'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

const validEmailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const getProp = (propName, defaultValue) =>
  R.pathOr(defaultValue, propName.split('.'))

export const validateEmail = (propName, item) => {
  const email = getProp(propName)(item)
  return email && !validEmailRe.test(email)
    ? { key: Validation.messageKeys.user.emailInvalid }
    : null
}

export const validateUser = async user =>
  await Validator.validate(user, {
    name: [Validator.validateRequired(Validation.messageKeys.nameRequired)],
    email: [
      Validator.validateRequired(Validation.messageKeys.user.emailRequired),
      validateEmail,
    ],
    groupUuid: [
      Validator.validateRequired(Validation.messageKeys.user.groupRequired),
    ],
  })

export const validateInvitation = async user =>
  await Validator.validate(user, {
    email: [
      Validator.validateRequired(Validation.messageKeys.user.emailRequired),
      validateEmail,
    ],
    groupUuid: [
      Validator.validateRequired(Validation.messageKeys.user.groupRequired),
    ],
  })
