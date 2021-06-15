import './UserEdit.scss'

import React from 'react'
import { useParams } from 'react-router'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'

import ProfilePicture from '@webapp/components/profilePicture'
import { FormItem, Input } from '@webapp/components/form/Input'
import DropdownUserTitle from '@webapp/components/form/DropdownUserTitle'

import DropdownUserGroup from '../DropdownUserGroup'

import ProfilePictureEditor from './ProfilePictureEditor'

import { useEditUser } from './store'

const UserEdit = () => {
  const {
    ready,
    user,
    userToUpdate,
    canEdit,
    canEditName,
    canEditGroup,
    canEditEmail,
    canRemove,
    canSave,

    onUpdate,
    onUpdateProfilePicture,
    onSave,
    onRemove,
    onInviteRepeat,
  } = useEditUser()
  const { userUuid } = useParams()
  const i18n = useI18n()
  const validation = User.getValidation(userToUpdate)

  if (!ready) return null

  return (
    <div className="user-edit form">
      {canEdit ? (
        <ProfilePictureEditor
          userUuid={userUuid}
          onPictureUpdate={(profilePicture) => onUpdateProfilePicture({ profilePicture })}
          enabled
        />
      ) : (
        <ProfilePicture userUuid={userUuid} />
      )}

      <FormItem label={i18n.t('user.title')}>
        <DropdownUserTitle
          user={userToUpdate}
          onChange={onUpdate}
          validation={Validation.getFieldValidation(User.keysProps.title)(validation)}
        />
      </FormItem>

      <FormItem label={i18n.t('common.name')}>
        <Input
          disabled={!canEditName}
          placeholder={canEditName ? i18n.t('common.name') : i18n.t('usersView.notAcceptedYet')}
          value={User.getName(userToUpdate)}
          validation={canEditName ? Validation.getFieldValidation(User.keys.name)(validation) : {}}
          maxLength={User.nameMaxLength}
          onChange={(value) => onUpdate(User.assocName(value)(userToUpdate))}
        />
      </FormItem>

      <FormItem label={i18n.t('common.email')}>
        <Input
          disabled={!canEditEmail}
          placeholder={i18n.t('common.email')}
          value={User.getEmail(userToUpdate)}
          validation={Validation.getFieldValidation(User.keys.email)(validation)}
          onChange={(value) => onUpdate(User.assocEmail(value)(userToUpdate))}
        />
      </FormItem>
      <FormItem label={i18n.t('common.group')}>
        <DropdownUserGroup
          editingLoggedUser={User.isEqual(user)(userToUpdate)}
          disabled={!canEditGroup}
          validation={Validation.getFieldValidation(User.keys.groupUuid)(validation)}
          groupUuid={User.getGroupUuid(userToUpdate)}
          onChange={(value) => onUpdate(User.assocGroupUuid(value)(userToUpdate))}
        />
      </FormItem>

      {(canEdit || User.isInvitationExpired(userToUpdate)) && (
        <div className="user-edit__buttons">
          {canRemove && (
            <button type="button" className="btn-s btn-danger btn-remove-user" onClick={onRemove}>
              <span className="icon icon-bin icon-left icon-10px" />
              {i18n.t('userView.removeFromSurvey')}
            </button>
          )}

          {canEdit && (
            <button type="button" className="btn btn-save" aria-disabled={!canSave} onClick={onSave}>
              <span className="icon icon-floppy-disk icon-left icon-12px" />
              {i18n.t('common.save')}
            </button>
          )}

          {User.isInvitationExpired(userToUpdate) && (
            <button type="button" className="btn btn-invite" onClick={onInviteRepeat}>
              <span className="icon icon-envelop icon-left icon-12px" />
              {i18n.t('userView.sendNewInvitation')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default UserEdit
