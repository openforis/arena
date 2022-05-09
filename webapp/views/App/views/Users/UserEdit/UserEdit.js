import './UserEdit.scss'

import React from 'react'
import { useParams } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'
import * as AuthGroup from '@core/auth/authGroup'

import { useI18n } from '@webapp/store/system'

import ProfilePicture from '@webapp/components/profilePicture'
import { FormItem, Input } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'
import DropdownUserTitle from '@webapp/components/form/DropdownUserTitle'
import { ButtonSave, ButtonDelete, ButtonInvite, Button } from '@webapp/components'

import { useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanUseMap } from '@webapp/store/user/hooks'

import DropdownUserGroup from '../DropdownUserGroup'

import ProfilePictureEditor from './ProfilePictureEditor'

import { useEditUser } from './store'

const UserEdit = () => {
  const { userUuid } = useParams()

  const {
    ready,
    dirty,
    user,
    userToUpdate,
    canEdit,
    canEditName,
    canEditGroup,
    canEditEmail,
    canRemove,
    canSave,
    canViewEmail,
    canEditSystemAdmin,
    canEditSurveyManager,
    hideSurveyGroup,

    onMapApiKeyTest,
    onUpdate,
    onUpdateProfilePicture,
    onSurveyAuthGroupChange,
    onSurveyManagerChange,
    onSave,
    onRemove,
    onInviteRepeat,
  } = useEditUser({ userUuid })

  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const surveyUuid = Survey.getUuid(surveyInfo)
  const canUseMap = useAuthCanUseMap()

  if (!ready) return null

  const validation = canEdit ? User.getValidation(userToUpdate) : null

  const systemAdminGroup = User.getAuthGroupByName(AuthGroup.groupNames.systemAdmin)(user)
  const systemAdmin = User.isSystemAdmin(userToUpdate)
  const surveyManager = User.isSurveyManager(userToUpdate)

  const groupInCurrentSurvey = User.getAuthGroupBySurveyUuid({ surveyUuid })(userToUpdate)
  const invitationExpired = User.isInvitationExpired(userToUpdate)
  const editingSameUser = User.isEqual(user)(userToUpdate)

  return (
    <div className="user-edit form" key={userUuid}>
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
          disabled={!canEdit}
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

      {canViewEmail && (
        <FormItem label={i18n.t('common.email')}>
          <Input
            disabled={!canEditEmail}
            placeholder={i18n.t('common.email')}
            value={User.getEmail(userToUpdate)}
            validation={Validation.getFieldValidation(User.keys.email)(validation)}
            onChange={(value) => onUpdate(User.assocEmail(value)(userToUpdate))}
          />
        </FormItem>
      )}
      {canEditSystemAdmin && (
        <FormItem label={i18n.t('authGroups.systemAdmin.label')}>
          <Checkbox
            checked={systemAdmin}
            onChange={(value) => {
              const userUpdated = value
                ? User.assocAuthGroup(systemAdminGroup)(userToUpdate)
                : User.dissocAuthGroup(systemAdminGroup)(userToUpdate)
              onUpdate(userUpdated)
            }}
            disabled={!canEdit}
          />
        </FormItem>
      )}
      {canEditSurveyManager && !systemAdmin && (
        <FormItem label={i18n.t('authGroups.surveyManager.label')}>
          <Checkbox checked={surveyManager} onChange={onSurveyManagerChange} disabled={!canEdit} />
        </FormItem>
      )}
      {!hideSurveyGroup && !systemAdmin && (
        <FormItem label={i18n.t('usersView.roleInCurrentSurvey')}>
          <DropdownUserGroup
            editingLoggedUser={User.isEqual(user)(userToUpdate)}
            disabled={!canEditGroup}
            validation={Validation.getFieldValidation(User.keys.authGroupsUuids)(validation)}
            groupUuid={AuthGroup.getUuid(groupInCurrentSurvey)}
            onChange={onSurveyAuthGroupChange}
            showOnlySurveyGroups
          />
        </FormItem>
      )}
      {editingSameUser && hideSurveyGroup && canUseMap && (
        // show map api keys only when editing the current user
        <fieldset className="map-api-keys">
          <legend>{i18n.t('user.mapApiKeys.title')}</legend>
          <FormItem label={i18n.t('user.mapApiKeys.mapProviders.planet')}>
            <Input
              disabled={!canEditEmail}
              value={User.getMapApiKey({ provider: 'planet' })(userToUpdate)}
              validation={Validation.getFieldValidation(`${User.keysProps.mapApiKeyByProvider}.planet`)(validation)}
              onChange={(value) => onUpdate(User.assocMapApiKey({ provider: 'planet', apiKey: value })(userToUpdate))}
            />
            <Button
              label="common.test"
              onClick={() =>
                onMapApiKeyTest({
                  provider: 'planet',
                  apiKey: User.getMapApiKey({ provider: 'planet' })(userToUpdate),
                })
              }
            />
          </FormItem>
        </fieldset>
      )}
      {(canEdit || canRemove || invitationExpired) && (
        <div className="user-edit__buttons">
          {!hideSurveyGroup && canRemove && (
            <ButtonDelete
              onClick={onRemove}
              className="btn-s btn-danger btn-remove-user"
              label={i18n.t('userView.removeFromSurvey')}
            />
          )}

          {canEdit && <ButtonSave onClick={onSave} disabled={!canSave || !dirty} className="btn-save" />}

          {!hideSurveyGroup && invitationExpired && (
            <ButtonInvite onClick={onInviteRepeat} className="btn btn-invite" />
          )}
        </div>
      )}
    </div>
  )
}

export default UserEdit
