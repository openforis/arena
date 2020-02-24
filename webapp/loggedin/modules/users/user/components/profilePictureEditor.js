import './profilePictureEditor.scss'

import * as FileTypes from '@webapp/utils/fileTypes'

import React, { useEffect, useRef, useState } from 'react'
import AvatarEditor from 'react-avatar-editor'

import { useProfilePicture, useFileDrop, useI18n } from '@webapp/commonComponents/hooks'

import UploadButton from '@webapp/commonComponents/form/uploadButton'

const ProfilePictureEditor = ({ userUuid, onPictureUpdate, enabled }) => {
  const i18n = useI18n()

  const initialProfilePicture = useProfilePicture(userUuid)

  const dropRef = useRef(null)
  const avatarRef = useRef(null)

  const [settingInitialPicture, setSettingInitialPicture] = useState(false)
  const [image, setImage] = useState(null)
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)

  useEffect(() => {
    if (initialProfilePicture) {
      setSettingInitialPicture(true)
      setImage(initialProfilePicture)
    }
  }, [initialProfilePicture])

  useFileDrop(setImage, dropRef, [FileTypes.image])

  const resetSliders = () => {
    setScale(1)
    setRotate(0)
  }

  const onImageChange = () => {
    if (settingInitialPicture) {
      setSettingInitialPicture(false)
    } else if (avatarRef.current) {
      // Call onPictureUpdate callback only if not setting initial picture
      const canvas = avatarRef.current.getImageScaledToCanvas()
      canvas.toBlob(onPictureUpdate, 'image/webp', 0.6)
    }
  }

  return (
    <>
      <div ref={dropRef} className="profile-picture-editor">
        {image && (
          <AvatarEditor
            ref={avatarRef}
            image={image}
            onImageChange={e => enabled && onImageChange(e)}
            onImageReady={onImageChange}
            onLoadSuccess={resetSliders}
            width={220}
            height={220}
            border={10}
            color={[255, 255, 255]}
            scale={scale}
            rotate={rotate}
          />
        )}

        <div>
          {i18n.t('userView.dragAndDrop')}{' '}
          <UploadButton
            label={i18n.t('userView.upload')}
            showLabel={true}
            showIcon={false}
            className="btn btn-transparent btn-upload"
            accept="image/*"
            onChange={([file]) => setImage(file)}
          />
        </div>

        <div className="form profile-picture-editor__sliders">
          <div className="form-item">
            <label className="form-label">{i18n.t('userView.scale')}</label>
            <div>
              <input
                value={scale}
                disabled={!enabled}
                onChange={e => setScale(Number(e.target.value))}
                className="slider"
                type="range"
                step="0.01"
                min="1"
                max="3"
                name="scale"
              />
            </div>
          </div>

          <div className="form-item">
            <label className="form-label">{i18n.t('userView.rotate')}</label>
            <div>
              <input
                value={rotate}
                disabled={!enabled}
                onChange={e => setRotate(Number(e.target.value))}
                className="slider"
                type="range"
                step="1"
                min="0"
                max="360"
                name="rotate"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfilePictureEditor
