import './profilePictureEditor.scss'

import * as FileTypes from '../../../../../utils/fileTypes'

import React, { useEffect, useRef, useState } from 'react'
import AvatarEditor from 'react-avatar-editor'

import { useProfilePicture, useFileDrop } from '../../../../../commonComponents/hooks'
import { useI18n } from '../../../../../commonComponents/hooks'

import UploadButton from '../../../../../commonComponents/form/uploadButton'

const ProfilePictureEditor = ({ userUuid, onPictureUpdate, enabled }) => {

  const i18n = useI18n()

  const initialProfilePicture = useProfilePicture(userUuid)

  const dropRef = useRef(null)
  const avatarRef = useRef(null)

  const [state, setState] = useState({
    image: null,
    scale: 1,
    rotate: 0,
  })

  const setImage = image => setState(statePrev => ({ ...statePrev, image }))

  const setScale = scale => setState(statePrev => ({ ...statePrev, scale }))

  const setRotate = rotate => setState(statePrev => ({ ...statePrev, rotate }))

  useEffect(() => {
    setImage(initialProfilePicture)
  }, [initialProfilePicture])

  useFileDrop(
    setImage,
    dropRef, [FileTypes.image])

  const resetSliders = () => {
    setState(statePrev => ({
      ...statePrev,
      scale: 1,
      rotate: 0,
    }))
  }

  const onImageChange = (evt) => {
    if (avatarRef.current) {
      const canvas = avatarRef.current.getImageScaledToCanvas()
      canvas.toBlob(onPictureUpdate, 'image/webp', 0.6)
    }
  }

  return (
    <>
      <div ref={dropRef} className="profile-picture-editor">

        {
          state.image &&
          <AvatarEditor
            ref={avatarRef}
            image={state.image}
            onImageChange={e => enabled && onImageChange(e)}
            onImageReady={onImageChange}
            onLoadSuccess={resetSliders}
            width={220}
            height={220}
            border={10}
            color={[255, 255, 255]}
            scale={state.scale}
            rotate={state.rotate}
          />
        }

        <div>
          {i18n.t('userView.dragAndDrop')} <UploadButton
            label={i18n.t('userView.upload')}
            showLabel={true}
            showIcon={false}
            className="btn btn-transparent btn-upload"
            accept="image/*"
            onChange={([file]) => setImage(file)}/>
        </div>

        <div className="form profile-picture-editor__sliders">
          <div className="form-item">
            <label className="form-label">{i18n.t('userView.scale')}</label>
            <div>
              <input value={state.scale}
                     disabled={!enabled}
                     onChange={e => setScale(+e.target.value)}
                     className="slider"
                     type="range"
                     step="0.01"
                     min="1"
                     max="3"
                     name="scale"/>
            </div>
          </div>

          <div className="form-item">
            <label className="form-label">{i18n.t('userView.rotate')}</label>
            <div>
              <input value={state.rotate}
                     disabled={!enabled}
                     onChange={e => setRotate(+e.target.value)}
                     className="slider"
                     type="range"
                     step="1"
                     min="0"
                     max="360"
                     name="rotate"/>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

export default ProfilePictureEditor
