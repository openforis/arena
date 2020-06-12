import { useState } from 'react'

import { useActions } from './actions/index'

export const useInviteUser = () => {
  const [userInvite, setUserInvite] = useState({})

  const { onInvite, onUpdate } = useActions({ userInvite, setUserInvite })

  return {
    userInvite,
    onUpdate,
    onInvite,
  }
}
