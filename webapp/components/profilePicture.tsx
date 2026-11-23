import './profilePicture.scss'

import ImageProgressive from './ImageProgressive'

const defaultPictureSrc = '/img/user-profile-picture-default-32x32.png'

type ProfilePictureProps = {
  userUuid?: string
  forceUpdateKey?: number
  hasProfilePicture?: boolean
  thumbnail?: boolean
}

const ProfilePicture = (props: ProfilePictureProps) => {
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

export default ProfilePicture
