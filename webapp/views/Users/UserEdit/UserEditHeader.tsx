import { useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'

import * as User from '@core/user/user'
import { Button, Modal, ModalBody, ModalFooter } from '@webapp/components'
import ProfilePicture from '@webapp/components/ProfilePicture'
import { useI18n } from '@webapp/store/system'

import ProfilePictureEditor from './ProfilePictureEditor'

const defaultPictureSrc = '/img/user-profile-picture-default.png'

// object URL of the picture chosen in the editor and not saved yet
const useUnsavedPictureUrl = (profilePicture: unknown): string | null => {
  const url = useMemo(
    () => (profilePicture instanceof Blob ? URL.createObjectURL(profilePicture) : null),
    [profilePicture]
  )
  useEffect(() => () => url && URL.revokeObjectURL(url), [url])
  return url
}

const UserEditAvatar = (props: { userUuid?: string; userToUpdate: any }) => {
  const { userUuid, userToUpdate } = props
  const pictureChanged = User.isProfilePictureSet(userToUpdate)
  const unsavedPictureUrl = useUnsavedPictureUrl(pictureChanged ? User.getProfilePicture(userToUpdate) : null)

  if (unsavedPictureUrl || pictureChanged || !userUuid) {
    return <img alt="" className="user-edit-header__picture" src={unsavedPictureUrl ?? defaultPictureSrc} />
  }
  return (
    <div className="user-edit-header__picture">
      <ProfilePicture userUuid={userUuid} />
    </div>
  )
}

type Chip = { key: string; label: string; variant?: 'success' | 'warning' }

type Props = {
  canEdit: boolean
  chips: Chip[]
  onPictureUpdate: (profilePicture: Blob | null) => void
  showEmail: boolean
  userUuid?: string
  userToUpdate: any
}

/**
 * Summary of the user being edited: picture, name, email and roles; the picture is changed in a dialog.
 */
export const UserEditHeader = (props: Props) => {
  const { canEdit, chips, onPictureUpdate, showEmail, userUuid, userToUpdate } = props
  const i18n = useI18n()
  const [pictureEditorOpen, setPictureEditorOpen] = useState(false)

  const name = User.getName(userToUpdate)
  const email = User.getEmail(userToUpdate)

  return (
    <section className="user-edit-header">
      <UserEditAvatar userToUpdate={userToUpdate} userUuid={userUuid} />
      <div className="user-edit-header__text">
        <h1 className="user-edit-header__name">{name || email || i18n.t('usersView:profile.newUser')}</h1>
        {showEmail && name && email && <span className="user-edit-header__email">{email}</span>}
        {chips.length > 0 && (
          <div className="user-edit-header__chips">
            {chips.map(({ key, label, variant }) => (
              <span
                key={key}
                className={classNames('user-edit-header__chip', {
                  [`user-edit-header__chip--${variant}`]: Boolean(variant),
                })}
              >
                {i18n.t(label)}
              </span>
            ))}
          </div>
        )}
      </div>
      {canEdit && (
        <Button
          iconName="camera"
          label="usersView:profile.changePicture"
          onClick={() => setPictureEditorOpen(true)}
          variant="outlined"
        />
      )}
      {pictureEditorOpen && (
        <Modal
          className="user-edit-picture-modal"
          onClose={() => setPictureEditorOpen(false)}
          showCloseButton
          title="usersView:profile.profilePicture"
        >
          <ModalBody>
            <ProfilePictureEditor onPictureUpdate={onPictureUpdate} userUuid={userUuid} />
          </ModalBody>
          <ModalFooter>
            <Button label="common.close" onClick={() => setPictureEditorOpen(false)} />
          </ModalFooter>
        </Modal>
      )}
    </section>
  )
}
