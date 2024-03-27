import * as UserGroupInvite from '@core/user/userGroupInvitation'
import * as UserValidator from '@core/user/userValidator'

export const validateUserEdit = async (userUpdated) => {
  const validation = await UserValidator.validateUser(userUpdated)
  return UserGroupInvite.assocValidation(validation)(userUpdated)
}
