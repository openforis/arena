import * as UserValidator from '@core/user/userValidator'
import * as UserGroupInvite from '@core/user/userGroupInvitation'

export const validateUserEdit = async (userUpdated) => {
  const validation = await UserValidator.validateUser(userUpdated)
  return UserGroupInvite.assocValidation(validation)(userUpdated)
}
