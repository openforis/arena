import { useOnInvite } from './useOnInvite'
import { useOnUpdate } from './useOnUpdate'

export const useActions = ({ userInvite, setUserInvite }) => ({
  onUpdate: useOnUpdate({ userInvite, setUserInvite }),
  onInvite: useOnInvite({ userInvite, setUserInvite }),
})
