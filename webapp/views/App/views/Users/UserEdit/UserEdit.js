import './UserEdit.scss'

import React from 'react'
import { useNavigate, useParams } from 'react-router'

import { Objects } from '@openforis/arena-core'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { Button, ButtonDelete, ButtonInvite, ButtonSave, ExpansionPanel } from '@webapp/components'
import Checkbox from '@webapp/components/form/checkbox'
import DropdownUserTitle from '@webapp/components/form/DropdownUserTitle'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import ProfilePicture from '@webapp/components/profilePicture'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanUseMap } from '@webapp/store/user/hooks'

import DropdownUserGroup from '../DropdownUserGroup'
import ProfilePictureEditor from './ProfilePictureEditor'
import { useEditUser } from './store'
import { UserAuthGroupExtraPropsEditor } from './UserAuthGroupExtraPropsEditor/UserAuthGroupExtraPropsEditor'
import { UserExtraPropsEditor } from './UserExtraPropsEditor'
import { DropdownPreferredUILanguage } from './DropdownPreferredUILanguage'

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
    canEditMaxSurveys,
    canEditSystemAdmin,
    canEditSurveyManager,
    hideSurveyGroup,

    onMapApiKeyTest,
    onUpdate,
    onUpdateProfilePicture,
    onSurveyAuthGroupChange,
    onSurveyManagerChange,
    onExtraChange,
    onSurveyExtraPropsChange,
    onSave,
    onRemove,
    onInviteRepeat,
  } = useEditUser({ userUuid })

  const navigate = useNavigate()
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
    <div className="user-edit" key={userUuid}>
      {canEdit ? (
        <ProfilePictureEditor
          userUuid={userUuid}
          onPictureUpdate={(profilePicture) => onUpdateProfilePicture({ profilePicture })}
          enabled
        />
      ) : (
        <ProfilePicture userUuid={userUuid} />
      )}

      <FormItem label="user.title">
        <DropdownUserTitle
          disabled={!canEdit}
          user={userToUpdate}
          onChange={onUpdate}
          validation={Validation.getFieldValidation(User.keysProps.title)(validation)}
        />
      </FormItem>

      <FormItem label="common.name">
        <Input
          disabled={!canEditName}
          placeholder={canEditName ? 'common.name' : 'usersView.notAcceptedYet'}
          value={User.getName(userToUpdate)}
          validation={canEditName ? Validation.getFieldValidation(User.keys.name)(validation) : {}}
          maxLength={User.nameMaxLength}
          onChange={(value) => onUpdate(User.assocName(value)(userToUpdate))}
        />
      </FormItem>

      {canViewEmail && (
        <FormItem label="common.email">
          <Input
            disabled={!canEditEmail}
            placeholder="common.email"
            value={User.getEmail(userToUpdate)}
            validation={Validation.getFieldValidation(User.keys.email)(validation)}
            onChange={(value) => onUpdate(User.assocEmail(value)(userToUpdate))}
          />
        </FormItem>
      )}

      <FormItem label="userView.preferredUILanguage.label">
        <DropdownPreferredUILanguage user={userToUpdate} onChange={onUpdate} />
      </FormItem>

      <UserExtraPropsEditor onChange={onExtraChange} user={userToUpdate} />

      {canEditSystemAdmin && (
        <FormItem label="auth:authGroups.systemAdmin.label">
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
        <FormItem label="auth:authGroups.surveyManager.label">
          <Checkbox checked={surveyManager} onChange={onSurveyManagerChange} disabled={!canEdit} />
        </FormItem>
      )}
      {canEditMaxSurveys && !systemAdmin && surveyManager && (
        <FormItem label="userView.maxSurveysUserCanCreate">
          <Input
            numberFormat={NumberFormats.integer({ allowNegative: false, allowZero: false })}
            type="number"
            value={User.getMaxSurveys(userToUpdate)}
            validation={Validation.getFieldValidation(User.keysProps.maxSurveys)(validation)}
            onChange={(value) => onUpdate(User.assocMaxSurveys(value)(userToUpdate))}
          />
        </FormItem>
      )}
      {!hideSurveyGroup && (
        <>
          {!systemAdmin && (
            <FormItem label="usersView.roleInCurrentSurvey">
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
          <ExpansionPanel
            buttonLabel="usersView.surveyExtraProp.label_other"
            className="extra-props"
            startClosed={Objects.isEmpty(User.getAuthGroupExtraProps(userToUpdate))}
          >
            <UserAuthGroupExtraPropsEditor onChange={onSurveyExtraPropsChange} userToUpdate={userToUpdate} />
          </ExpansionPanel>
        </>
      )}
      {editingSameUser && hideSurveyGroup && canUseMap && (
        // show map api keys only when editing the current user
        <fieldset className="map-api-keys">
          <legend>{i18n.t('user.mapApiKeys.title')}</legend>
          <FormItem label="user.mapApiKeys.mapProviders.planet">
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
          <Button
            iconClassName="icon-pencil"
            label="userPasswordChangeView.changePassword"
            onClick={() => navigate(appModuleUri(userModules.userPasswordChange))}
          />

          {canEdit && <ButtonSave onClick={onSave} disabled={!canSave || !dirty} className="btn-save" />}

          {!hideSurveyGroup && invitationExpired && (
            <ButtonInvite onClick={onInviteRepeat} className="btn btn-invite" />
          )}

          {!hideSurveyGroup && canRemove && (
            <ButtonDelete
              onClick={onRemove}
              className="btn-s btn-danger btn-remove-user"
              label="userView.removeFromSurvey"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default UserEdit
