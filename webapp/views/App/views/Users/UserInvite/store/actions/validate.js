import * as UserInvite from '@core/user/userGroupInvitation'
import * as UserValidator from '@core/user/userValidator'

export const validateUserInvite = async (userInvite) => {
  const validation = await UserValidator.validateInvitation(userInvite)
  return UserInvite.assocValidation(validation)(userInvite)
}
