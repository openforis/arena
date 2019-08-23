import React, { useRef, useState } from 'react'
import AvatarEditor from 'react-avatar-editor'

import { useFileDrop } from '../../../../../commonComponents/hooks'

const ProfilePictureEditor = ({ profilePicture }) => {
  const profilePictureRef = useRef(null)

  const [picture, setPicture] = useState(profilePicture)
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)

  // useEffect(() => setPicture(picture), [profilePicture])

  useFileDrop(profilePictureRef, files => {
    const imgFile = files.find(f => f.kind === 'file' && f.type.startsWith('image'))

    if (imgFile) {
      const reader = new FileReader()

      reader.readAsDataURL(imgFile.getAsFile())
      reader.onloadend = () => setPicture(reader.result)

      // reset sliders
      setScale(1)
      setRotate(0)
    }
  })

  return (
    <>
      <div ref={profilePictureRef} className="profile-picture">
        {
          <AvatarEditor
            image={picture}
            width={200}
            height={200}
            border={20}
            color={[255, 255, 255, 0.6]}
            scale={scale}
            rotate={rotate} />
        }
      </div>
      <div>
        <input value={scale}
               onChange={e => setScale(+e.target.value)}
               className="slider"
               type="range"
               step="0.01"
               min="1"
               max="2"
               name="scale" />
      </div>
      <div>
        <input value={rotate}
               onChange={e => setRotate(+e.target.value)}
               className="slider"
               type="range"
               step="1"
               min="0"
               max="360"
               name="scale" />
      </div>
    </>
  )
}

export default ProfilePictureEditor
