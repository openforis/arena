import './profilePictureEditor.scss'

import * as FileTypes from '../../../../../utils/fileTypes'

import React, { useEffect, useRef, useState } from 'react'
import AvatarEditor from 'react-avatar-editor'

import { useFileDrop } from '../../../../../commonComponents/hooks'
import useI18n from '../../../../../commonComponents/useI18n'

const ProfilePictureEditor = ({ image: initialImage, onPictureUpdate, enabled }) => {

  const i18n = useI18n()

  const dropRef = useRef(null)
  const avatarRef = useRef(null)

  const [state, setState] = useState({
    image: null,
    scale: 1,
    rotate: 0,
  })

  const setScale = scale => setState(statePrev => ({
    ...statePrev,
    scale,
  }))

  const setRotate = rotate => setState(statePrev => ({
    ...statePrev,
    rotate,
  }))

  useEffect(() => {
    if (initialImage) {
      setState(statePrev => ({
        ...statePrev,
        image: initialImage,
      }))
    }
  }, [initialImage])

  useFileDrop(
    image => {
      setState(statePrev => ({
        ...statePrev,
        image,
      }))
    },
    dropRef, [FileTypes.image])

  const resetSliders = () => {
    setState(statePrev => ({
      ...statePrev,
      scale: 1,
      rotate: 0,
    }))
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
          !enabled &&
          <div className="drop-text">{i18n.t('profilePictureEditor.imageDrop')}</div>
        }

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
            rotate={state.rotate}/>
        }

        <div className="form profile-picture-editor__sliders">
          <div className="form-item">
            <label className="form-label">{i18n.t('profilePictureEditor.scale')}</label>
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
            <label className="form-label">{i18n.t('profilePictureEditor.rotate')}</label>
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
