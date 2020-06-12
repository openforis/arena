import * as UserInvite from '@core/user/userInvite'

import { validateUserEdit } from './validate'

export const useOnUpdate = ({ userToUpdate, setUserToUpdate }) => {
  return ({ name, value }) => {
    ;(async () => {
      const userUpdated = UserInvite.assocProp(name, value)(userToUpdate)
      const userUpdatedValidated = await validateUserEdit(userUpdated)
      setUserToUpdate(userUpdatedValidated)
    })()
  }
}
