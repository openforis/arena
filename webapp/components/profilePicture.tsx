import './profilePicture.scss'

import PropTypes from 'prop-types'
import ImageProgressive from './ImageProgressive'

const defaultPictureSrc = '/img/user-profile-picture-default-32x32.png'

const ProfilePicture = (props) => {
  const {
    forceUpdateKey = 0, // Change it when picture of same user must be reloaded
    hasProfilePicture = true, // when false, the default picture is shown without fetching it from the server
    thumbnail = false,
    userUuid = 'null',
  } = props

  return (
    <ImageProgressive
      className={`profile-picture${thumbnail ? '-thumbnail' : ''}`}
      alt="profile"
      altSrc={defaultPictureSrc}
      placeholderSrc={defaultPictureSrc}
      src={hasProfilePicture ? `/api/user/${userUuid}/profilePicture?updateKey=${forceUpdateKey}` : defaultPictureSrc}
    />
  )
}

ProfilePicture.propTypes = {
  userUuid: PropTypes.string,
  forceUpdateKey: PropTypes.number,
  hasProfilePicture: PropTypes.bool,
  thumbnail: PropTypes.bool,
}

export default ProfilePicture
