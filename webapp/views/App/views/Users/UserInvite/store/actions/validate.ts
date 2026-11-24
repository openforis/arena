import * as UserValidator from '@core/user/userValidator'
import * as UserInvite from '@core/user/userGroupInvitation'

export const validateUserInvite = async (userInvite) => {
  const validation = await UserValidator.validateInvitation(userInvite)
  return UserInvite.assocValidation(validation)(userInvite)
}
