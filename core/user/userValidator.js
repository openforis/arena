import * as R from 'ramda'

import * as User from '@core/user/user'
import * as UserInvite from '@core/user/userInvite'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

const validEmailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

export const validateEmail = (propName, item) => {
  const email = getProp(propName)(item)
  return email && !validEmailRe.test(email) ? { key: Validation.messageKeys.user.emailInvalid } : null
}

export const validateUser = async (user) =>
  Validator.validate(user, {
    [`${User.keys.props}.${User.keysProps.title}`]: [
      Validator.validateRequired(Validation.messageKeys.user.titleRequired),
    ],
    [User.keys.name]: [Validator.validateRequired(Validation.messageKeys.nameRequired)],
    [User.keys.email]: [Validator.validateRequired(Validation.messageKeys.user.emailRequired), validateEmail],
    [User.keys.groupUuid]: [Validator.validateRequired(Validation.messageKeys.user.groupRequired)],
  })

export const validateInvitation = async (userInvite) =>
  Validator.validate(userInvite, {
    [UserInvite.keys.email]: [Validator.validateRequired(Validation.messageKeys.user.emailRequired), validateEmail],
    [UserInvite.keys.groupUuid]: [Validator.validateRequired(Validation.messageKeys.user.groupRequired)],
  })
