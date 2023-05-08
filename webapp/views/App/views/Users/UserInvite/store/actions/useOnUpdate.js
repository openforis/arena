import * as AuthGroup from '@core/auth/authGroup'
import * as UserInvite from '@core/user/userGroupInvitation'

import { validateUserInvite } from './validate'
import { useCallback } from 'react'

export const useOnUpdate = ({ userInvite, setUserInvite }) => {
  return useCallback(
    async ({ name, value }) => {
      let userInviteUpdated = UserInvite.assocProp(name, value)(userInvite)

      if (name === UserInvite.keys.groupUuid) {
        const group = value
        const inviteAsSurveyManagerNext = AuthGroup.isSurveyGroup(group)
        userInviteUpdated = UserInvite.assocProp(
          UserInvite.keys.inviteAsSurveyManager,
          inviteAsSurveyManagerNext
        )(userInviteUpdated)
      }
      const userInviteValidated = await validateUserInvite(userInviteUpdated)
      setUserInvite(userInviteValidated)
    },
    [setUserInvite, userInvite]
  )
}
