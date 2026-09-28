import { useGetUser } from './useGetUser'
import { useOnUpdate } from './useOnUpdate'
import { useOnUpdateProfilePicture } from './useOnUpdateProfilePicture'
import { useOnSave } from './useOnSave'
import { useOnRemove } from './useOnRemove'
import { useOnInviteRepeat } from './useOnInviteRepeat'

export const useActions = ({
  userUuid,
  userToUpdate,
  setUserToUpdate,
  userToUpdateOriginal,
  setUserToUpdateOriginal,
}) => ({
  onGetUser: useGetUser({ userUuid, setUserToUpdate, setUserToUpdateOriginal }),
  onUpdate: useOnUpdate({ userToUpdate, setUserToUpdate }),
  onUpdateProfilePicture: useOnUpdateProfilePicture({ userToUpdate, setUserToUpdate }),
  onSave: useOnSave({ userToUpdate, setUserToUpdate, userToUpdateOriginal, setUserToUpdateOriginal }),
  onRemove: useOnRemove({ userToUpdate, setUserToUpdate }),
  onInviteRepeat: useOnInviteRepeat({ userToInvite: userToUpdate, setUserToUpdate }),
})
