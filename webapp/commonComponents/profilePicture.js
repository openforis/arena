import React from 'react'

import { useProfilePicture } from './hooks'

export default ({ userUuid, forceUpdateKey = 0 }) => {
  const picture = useProfilePicture(userUuid, forceUpdateKey)

  return <img src={picture}/>
}
