import * as User from '@core/user/user'
import * as UserInvite from '@core/user/userGroupInvitation'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

export const validateEmail = Validator.validateEmail({ errorKey: Validation.messageKeys.user.emailInvalid })

export const validateUser = async (user) =>
  Validator.validate(user, {
    [`${User.keys.props}.${User.keysProps.title}`]: [
      Validator.validateRequired(Validation.messageKeys.user.titleRequired),
    ],
    [User.keys.name]: [Validator.validateRequired(Validation.messageKeys.nameRequired)],
    [User.keys.email]: [Validator.validateRequired(Validation.messageKeys.user.emailRequired), validateEmail],
    [User.keys.authGroupsUuids]: [Validator.validateRequired(Validation.messageKeys.user.groupRequired)],
  })

export const validateInvitation = async (invitation) =>
  Validator.validate(invitation, {
    [UserInvite.keys.email]: [Validator.validateRequired(Validation.messageKeys.user.emailRequired), validateEmail],
    [UserInvite.keys.groupUuid]: [Validator.validateRequired(Validation.messageKeys.user.groupRequired)],
  })
