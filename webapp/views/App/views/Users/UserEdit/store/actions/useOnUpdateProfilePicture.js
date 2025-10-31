import * as A from '@core/arena'

import * as User from '@core/user/user'

export const useOnUpdateProfilePicture =
  ({ userToUpdate, setUserToUpdate }) =>
  ({ profilePicture }) => {
    setUserToUpdate(A.pipe(User.assocProfilePicture(profilePicture), User.assocProfilePictureSet(true))(userToUpdate))
  }
