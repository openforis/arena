import './UserEdit.scss'

import React from 'react'
import { useNavigate, useParams } from 'react-router'

import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
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
import { UserPasswordSetForm } from '../UserPasswordChange/UserPasswordSetForm'
import { SimpleTextInputWithValidation } from '@webapp/components/form/SimpleTextInputWithValidation'

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
  const surveyGroupsVisible = userUuid && !hideSurveyGroup

  return (
    <div className="user-edit" key={userUuid}>
      {canEdit && (
        <ProfilePictureEditor
          userUuid={userUuid}
          onPictureUpdate={(profilePicture) => onUpdateProfilePicture({ profilePicture })}
        />
      )}
      {!canEdit && userUuid && <ProfilePicture userUuid={userUuid} />}
      <FormItem label="user.title">
        <DropdownUserTitle
          disabled={!canEdit}
          user={userToUpdate}
          onChange={onUpdate}
          validation={Validation.getFieldValidation(User.keysProps.title)(validation)}
        />
      </FormItem>
      <SimpleTextInputWithValidation
        disabled={!canEditName}
        maxLength={User.nameMaxLength}
        onChange={(value) => onUpdate(User.assocName(value)(userToUpdate))}
        label={canEditName ? 'common.name' : 'usersView.notAcceptedYet'}
        validation={canEditName ? Validation.getFieldValidation(User.keys.name)(validation) : {}}
        value={User.getName(userToUpdate)}
      />
      {canViewEmail && (
        <SimpleTextInputWithValidation
          disabled={!canEditEmail}
          onChange={(value) => onUpdate(User.assocEmail(value)(userToUpdate))}
          label="common.email"
          validation={Validation.getFieldValidation(User.keys.email)(validation)}
          value={User.getEmail(userToUpdate)}
        />
      )}
      {userUuid && editingSameUser && (
        <FormItem label="userView.preferredUILanguage.label">
          <DropdownPreferredUILanguage user={userToUpdate} onChange={onUpdate} />
        </FormItem>
      )}
      <UserExtraPropsEditor onChange={onExtraChange} user={userToUpdate} />
      {(canEditSystemAdmin || (canEditSurveyManager && !systemAdmin)) && (
        <div className="form-input-container">
          {canEditSystemAdmin && (
            <Checkbox
              checked={systemAdmin}
              label="auth:authGroups.systemAdmin.label"
              onChange={(value) => {
                const userUpdated = value
                  ? User.assocAuthGroup(systemAdminGroup)(userToUpdate)
                  : User.dissocAuthGroup(systemAdminGroup)(userToUpdate)
                onUpdate(userUpdated)
              }}
              disabled={!canEdit}
            />
          )}
          {canEditSurveyManager && !systemAdmin && (
            <Checkbox
              checked={surveyManager}
              label="auth:authGroups.surveyManager.label"
              onChange={onSurveyManagerChange}
              disabled={!canEdit}
            />
          )}
        </div>
      )}
      {canEditMaxSurveys && !systemAdmin && surveyManager && (
        <FormItem label="userView.maxSurveysUserCanCreate">
          <Input
            className="max-surveys-input"
            maxLength={3}
            numberFormat={NumberFormats.integer({ allowNegative: false, allowZero: false })}
            type="number"
            value={User.getMaxSurveys(userToUpdate)}
            validation={Validation.getFieldValidation(User.keysProps.maxSurveys)(validation)}
            onChange={(value) => onUpdate(User.assocMaxSurveys(value)(userToUpdate))}
          />
        </FormItem>
      )}
      {surveyGroupsVisible && (
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
      {!userUuid && (
        <UserPasswordSetForm
          form={userToUpdate}
          onFieldChange={(fieldKey) => (value) => onUpdate(A.assoc(fieldKey)(value)(userToUpdate))}
          validation={validation}
        />
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
          {userUuid && (
            <Button
              iconClassName="icon-pencil"
              label="userPasswordChangeView.changePassword"
              onClick={() => navigate(appModuleUri(userModules.userPasswordChange))}
            />
          )}

          {canEdit && <ButtonSave onClick={onSave} disabled={!canSave || !dirty} className="btn-save" />}

          {surveyGroupsVisible && invitationExpired && (
            <ButtonInvite onClick={onInviteRepeat} className="btn btn-invite" />
          )}

          {surveyGroupsVisible && canRemove && (
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
