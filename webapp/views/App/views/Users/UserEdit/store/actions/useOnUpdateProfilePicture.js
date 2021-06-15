import * as User from '@core/user/user'

export const useOnUpdateProfilePicture =
  ({ userToUpdate, setUserToUpdate }) =>
  ({ profilePicture }) => {
    setUserToUpdate(User.assocProfilePicture(profilePicture)(userToUpdate))
  }
