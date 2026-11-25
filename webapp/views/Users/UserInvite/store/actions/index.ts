import { useOnUpdate } from './useOnUpdate'
import { useOnInvite } from './useOnInvite'

export const useActions = ({ userInvite, setUserInvite }) => ({
  onUpdate: useOnUpdate({ userInvite, setUserInvite }),
  onInvite: useOnInvite({ userInvite, setUserInvite }),
})
