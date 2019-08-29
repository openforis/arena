import './profilePictureEditor.scss'

import React, { useEffect, useRef, useState } from 'react'
import AvatarEditor from 'react-avatar-editor'

import { useFileDrop } from '../../../../../commonComponents/hooks'

const ProfilePictureEditor = ({ image: initialImage, onPictureUpdate, enabled }) => {

  const dropRef = useRef(null)
  const avatarRef = useRef(null)

  const [image, setImage] = useState(null)
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)

  useEffect(() => {
    if (initialImage) {
      setImage(initialImage)
    }
  }, [initialImage])

  useFileDrop(dropRef, files => {
    const imgFile = files.find(f => f.kind === 'file' && f.type.startsWith('image'))
    if (imgFile) {
      setImage(imgFile.getAsFile())
    }
  })

  const resetSliders = () => {
    setScale(1)
    setRotate(0)
  }

  const onImageChange = () => {
    if (avatarRef.current) {
      const canvas = avatarRef.current.getImageScaledToCanvas()
      canvas.toBlob(onPictureUpdate, 'image/jpeg', 0.6)
    }
  }

  return (
    <>
      <div ref={dropRef} className="profile-picture-editor">
        {
          image && <AvatarEditor
            ref={avatarRef}
            image={image}
            onImageChange={onImageChange}
            onImageReady={onImageChange}
            onLoadSuccess={resetSliders}
            width={200}
            height={200}
            border={20}
            color={[255, 255, 255, 0.6]}
            scale={scale}
            rotate={rotate} />
        }
      </div>
      <div className="form profile-picture-editor__sliders">
        <div className="form-item">
          <label className="form-label">Scale</label>
          <div>
            <input value={scale}
                   disabled={!enabled}
                   onChange={e => setScale(+e.target.value)}
                   className="slider"
                   type="range"
                   step="0.01"
                   min="1"
                   max="3"
                   name="scale" />
          </div>
        </div>

        <div className="form-item">
          <label className="form-label">Rotate</label>
          <div>
            <input value={rotate}
                   disabled={!enabled}
                   onChange={e => setRotate(+e.target.value)}
                   className="slider"
                   type="range"
                   step="1"
                   min="0"
                   max="360"
                   name="rotate" />
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfilePictureEditor
