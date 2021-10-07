import { useGetUser } from './useGetUser'
import { useOnUpdate } from './useOnUpdate'
import { useOnUpdateProfilePicture } from './useOnUpdateProfilePicture'
import { useOnSave } from './useOnSave'
import { useOnRemove } from './useOnRemove'
import { useOnInviteRepeat } from './useOnInviteRepeat'

export const useActions = ({ userToUpdate, setUserToUpdate, userToUpdateOriginal, setUserToUpdateOriginal }) => ({
  onGetUser: useGetUser({ setUserToUpdate, setUserToUpdateOriginal }),
  onUpdate: useOnUpdate({ userToUpdate, setUserToUpdate }),
  onUpdateProfilePicture: useOnUpdateProfilePicture({ userToUpdate, setUserToUpdate }),
  onSave: useOnSave({ userToUpdate, userToUpdateOriginal }),
  onRemove: useOnRemove({ userToUpdate, setUserToUpdate }),
  onInviteRepeat: useOnInviteRepeat({ userToUpdate, setUserToUpdate }),
})
