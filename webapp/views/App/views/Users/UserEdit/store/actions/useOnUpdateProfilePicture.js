import * as R from 'ramda'

const key = 'profilePicture'

export const useOnUpdateProfilePicture = ({ userToUpdate, setUserToUpdate }) => ({ profilePicture }) => {
  const userWithNewProfilePicture = R.pipe(R.assoc(key, profilePicture))(userToUpdate)
  setUserToUpdate(userWithNewProfilePicture)
}
