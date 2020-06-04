import './profilePicture.scss'

import React from 'react'

import { useProfilePicture } from './hooks'

const ProfilePicture = (props) => {
  const { userUuid, forceUpdateKey, thumbnail } = props

  const src = useProfilePicture(userUuid, forceUpdateKey)

  return <img src={src} className={`profile-picture${thumbnail ? '-thumbnail' : ''}`} />
}

ProfilePicture.defaultProps = {
  userUuid: 'null',
  forceUpdateKey: 0, // Change it when picture of same user must be reloaded
  thumbnail: false,
}

export default ProfilePicture
