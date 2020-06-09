import './profilePicture.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { useProfilePicture } from '@webapp/store/user'

const ProfilePicture = (props) => {
  const { userUuid, forceUpdateKey, thumbnail } = props

  const src = useProfilePicture(userUuid, forceUpdateKey)

  return <img src={src} alt="profile" className={`profile-picture${thumbnail ? '-thumbnail' : ''}`} />
}

ProfilePicture.propTypes = {
  userUuid: PropTypes.string,
  forceUpdateKey: PropTypes.number,
  thumbnail: PropTypes.bool,
}

ProfilePicture.defaultProps = {
  userUuid: 'null',
  forceUpdateKey: 0, // Change it when picture of same user must be reloaded
  thumbnail: false,
}

export default ProfilePicture
