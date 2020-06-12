import * as UserValidator from '@core/user/userValidator'
import * as UserInvite from '@core/user/userInvite'

export const validateUserEdit = async (userUpdated) => {
  const validation = await UserValidator.validateUser(userUpdated)
  return UserInvite.assocValidation(validation)(userUpdated)
}
