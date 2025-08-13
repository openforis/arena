import './ProfilePictureEditor.scss'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import AvatarEditor from 'react-avatar-editor'

import * as FileTypes from '@webapp/utils/fileTypes'

import { useConfirm, useFileDrop } from '@webapp/components/hooks'
import { useProfilePicture } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import UploadButton from '@webapp/components/form/uploadButton'
import { ButtonIconDelete } from '@webapp/components'

const profilePicturePlaceholderImgSrc = '/img/user-profile-picture-default.png'

const width = 200
const height = 200
const border = 10

const ProfilePicturePlaceholder = () => (
  <div
    className="profile-picture-placeholder-wrapper"
    style={{ height: height + border * 2, width: width + border * 2 }}
  >
    <img
      alt="Profile picture unset"
      className="profile-picture-placeholder-img"
      height={height}
      width={width}
      src={profilePicturePlaceholderImgSrc}
    />
  </div>
)

const ProfilePictureEditor = (props) => {
  const { onPictureUpdate, userUuid = null } = props

  const i18n = useI18n()
  const confirm = useConfirm()

  const initialProfilePicture = useProfilePicture(userUuid)

  const dropRef = useRef(null)
  const avatarRef = useRef(null)

  const [settingInitialPicture, setSettingInitialPicture] = useState(false)
  const [image, setImage] = useState(profilePicturePlaceholderImgSrc)
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

  const onImageChange = useCallback(() => {
    if (settingInitialPicture) {
      setSettingInitialPicture(false)
    } else if (avatarRef.current) {
      // Call onPictureUpdate callback only if not setting initial picture
      const canvas = avatarRef.current.getImageScaledToCanvas()
      canvas.toBlob(onPictureUpdate, 'image/webp', 0.6)
    }
  }, [onPictureUpdate, settingInitialPicture])

  const onImageDeleted = useCallback(() => {
    setImage(profilePicturePlaceholderImgSrc)
    onPictureUpdate(null)
  }, [onPictureUpdate])

  const onDeleteClick = useCallback(() => {
    confirm({ key: 'userView.remove', onOk: onImageDeleted })
  }, [confirm, onImageDeleted])

  return (
    <>
      <div ref={dropRef} className="profile-picture-editor">
        {image && (
          <>
            {image === profilePicturePlaceholderImgSrc && <ProfilePicturePlaceholder />}
            {image !== profilePicturePlaceholderImgSrc && (
              <div>
                <AvatarEditor
                  ref={avatarRef}
                  image={image}
                  onImageChange={onImageChange}
                  onImageReady={onImageChange}
                  onLoadSuccess={resetSliders}
                  width={width}
                  height={height}
                  border={border}
                  color={[255, 255, 255]}
                  scale={scale}
                  rotate={rotate}
                />
                <ButtonIconDelete onClick={onDeleteClick} />
              </div>
            )}
          </>
        )}

        <div>
          {i18n.t('userView.dragAndDrop')}{' '}
          <UploadButton
            label="userView.upload"
            showLabel
            showIcon={false}
            className="btn btn-transparent btn-upload"
            accept="image/*"
            onChange={([file]) => setImage(file)}
          />
        </div>

        <div className="form profile-picture-editor__sliders">
          <div className="form-item">
            <label className="form-label" htmlFor="profile-picture-editor-scale">
              {i18n.t('userView.scale')}
            </label>
            <div>
              <input
                id="profile-picture-editor-scale"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
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
            <label className="form-label" htmlFor="profile-picture-editor-rotate">
              {i18n.t('userView.rotate')}
            </label>
            <div>
              <input
                id="profile-picture-editor-rotate"
                value={rotate}
                onChange={(e) => setRotate(Number(e.target.value))}
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

ProfilePictureEditor.propTypes = {
  userUuid: PropTypes.string,
  onPictureUpdate: PropTypes.func.isRequired,
}

export default ProfilePictureEditor
