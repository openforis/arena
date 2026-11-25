import { useGetUser } from './useGetUser'
import { useOnInviteRepeat } from './useOnInviteRepeat'
import { useOnRemove } from './useOnRemove'
import { useOnSave } from './useOnSave'
import { useOnUpdate } from './useOnUpdate'
import { useOnUpdateProfilePicture } from './useOnUpdateProfilePicture'

export const useActions = ({
  userUuid,
  userToUpdate,
  setUserToUpdate,
  userToUpdateOriginal,
  setUserToUpdateOriginal,
}) => ({
  onGetUser: useGetUser({ userUuid, setUserToUpdate, setUserToUpdateOriginal }),
  onUpdate: useOnUpdate({ setUserToUpdate }),
  onUpdateProfilePicture: useOnUpdateProfilePicture({ userToUpdate, setUserToUpdate }),
  onSave: useOnSave({ userToUpdate, setUserToUpdate, userToUpdateOriginal, setUserToUpdateOriginal }),
  onRemove: useOnRemove({ userToUpdate }),
  onInviteRepeat: useOnInviteRepeat({ userToInvite: userToUpdate }),
})
