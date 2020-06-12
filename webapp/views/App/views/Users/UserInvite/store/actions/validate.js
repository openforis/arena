import * as UserValidator from '@core/user/userValidator'
import * as UserInvite from '@core/user/userInvite'

export const validateUserInvite = async (userInvite) => {
  const validation = await UserValidator.validateInvitation(userInvite)
  return UserInvite.assocValidation(validation)(userInvite)
}
