import * as UserInvite from '@core/user/userInvite'

import { validateUserInvite } from './validate'

export const useOnUpdate = ({ userInvite, setUserInvite }) => {
  return ({ name, value }) => {
    ;(async () => {
      const userInviteUpdated = UserInvite.assocProp(name, value)(userInvite)
      const userInviteValidated = await validateUserInvite(userInviteUpdated)
      setUserInvite(userInviteValidated)
    })()
  }
}
