import * as User from '@core/user/user'
import * as UserInvite from '@core/user/userGroupInvitation'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import { checkTextHasLinks } from '@core/markdownValidator'

import { UserPasswordChangeFormValidator } from './userPasswordChangeFormValidator'

const invitationMessageMaxLength = 500

export const validateEmail = Validator.validateEmail({ errorKey: Validation.messageKeys.user.emailInvalid })

export const validateUser = async (
  user: Record<string, unknown>,
  userWithSameEmail: Record<string, unknown> | null = null
) => {
  const newUser = !User.getUuid(user)
  const propsValidations: any = {
    [`${User.keys.props}.${User.keysProps.title}`]: [
      Validator.validateRequired(Validation.messageKeys.user.titleRequired),
    ],
    [User.keys.name]: [Validator.validateRequired(Validation.messageKeys.nameRequired)],
    [User.keys.email]: [
      Validator.validateRequired(Validation.messageKeys.user.emailRequired),
      validateEmail,
      ...(newUser && userWithSameEmail
        ? [Validator.validateItemPropUniqueness(Validation.messageKeys.user.emailDuplicate)([userWithSameEmail])]
        : []),
    ],
  }

  if (newUser) {
    // new user
    Object.assign(
      propsValidations,
      UserPasswordChangeFormValidator.getPropsValidations({ passwordRequired: false, includeOldPassword: false })
    )
  } else {
    propsValidations[User.keys.authGroupsUuids] = [
      Validator.validateRequired(Validation.messageKeys.user.groupRequired),
    ]
  }

  return Validator.validate(user, propsValidations)
}

const validateInviteMessage = (_propName: string, item: Record<string, unknown>) => {
  const message = UserInvite.getMessage(item) as string
  if (message.length === 0) {
    return null
  }
  if (message.length > invitationMessageMaxLength) {
    return { key: Validation.messageKeys.userInvite.messageTooLong, params: { maxLength: invitationMessageMaxLength } }
  }
  if (checkTextHasLinks(message)) {
    return { key: Validation.messageKeys.userInvite.messageContainsLinks }
  }
  return null
}

export const validateInvitation = async (invitation: Record<string, unknown>) =>
  Validator.validate(invitation, {
    [UserInvite.keys.emails]: [
      Validator.validateRequired(Validation.messageKeys.user.emailRequired),
      Validator.validateEmails(),
    ],
    [UserInvite.keys.groupUuid]: [Validator.validateRequired(Validation.messageKeys.user.groupRequired)],
    [UserInvite.keys.message]: [validateInviteMessage],
  })
