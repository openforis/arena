import './profilePicture.scss'

import React from 'react'
import PropTypes from 'prop-types'
import ImageProgressive from './ImageProgressive'

const ProfilePicture = (props) => {
  const {
    forceUpdateKey = 0, // Change it when picture of same user must be reloaded
    thumbnail = false,
    userUuid = 'null',
  } = props

  return (
    <ImageProgressive
      className={`profile-picture${thumbnail ? '-thumbnail' : ''}`}
      alt="profile"
      altSrc="/img/user-profile-picture-default-32x32.png"
      placeholderSrc="/img/user-profile-picture-default-32x32.png"
      src={`/api/user/${userUuid}/profilePicture?updateKey=${forceUpdateKey}`}
    />
  )
}

ProfilePicture.propTypes = {
  userUuid: PropTypes.string,
  forceUpdateKey: PropTypes.number,
  thumbnail: PropTypes.bool,
}

export default ProfilePicture
