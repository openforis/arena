import './UserEdit.scss'

import React, { useCallback } from 'react'
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
import { FormItemWithInput } from '@webapp/components/form/FormItemWithInput'

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
    canViewSystemAdmin,
    canEditSystemAdmin,
    canViewSurveyManager,
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

  const onNameChange = useCallback((value) => onUpdate(User.assocName(value)(userToUpdate)), [onUpdate, userToUpdate])

  const onPasswordFormFieldChange = useCallback(
    (fieldKey) => (value) => onUpdate(A.assoc(fieldKey)(value)(userToUpdate)),
    [onUpdate, userToUpdate]
  )

  if (!ready) return null

  const validation = canEdit ? User.getValidation(userToUpdate) : null

  const systemAdminGroup = User.getAuthGroupByName(AuthGroup.groupNames.systemAdmin)(user)
  const systemAdmin = User.isSystemAdmin(userToUpdate)
  const surveyManager = User.isSurveyManager(userToUpdate)

  const groupInCurrentSurvey = User.getAuthGroupBySurveyUuid({ surveyUuid })(userToUpdate)
  const invitationExpired = User.isInvitationExpired(userToUpdate)
  const editingSameUser = User.isEqual(user)(userToUpdate)
  const newUser = !userUuid
  const surveyGroupsVisible = !newUser && !hideSurveyGroup
  const surveyHasExtraProps = Objects.isNotEmpty(Survey.getUserExtraPropDefs(surveyInfo))

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
      <FormItemWithInput
        disabled={!canEditName}
        maxLength={User.nameMaxLength}
        onChange={onNameChange}
        label={canEditName ? 'common.name' : 'usersView.notAcceptedYet'}
        validation={canEditName ? Validation.getFieldValidation(User.keys.name)(validation) : {}}
        value={User.getName(userToUpdate)}
      />
      {canViewEmail && (
        <FormItemWithInput
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

      {(canViewSystemAdmin || (canViewSurveyManager && !systemAdmin)) && (
        <div className="form-input-container">
          {canViewSystemAdmin && (
            <Checkbox
              checked={systemAdmin}
              disabled={!canEdit || !canEditSystemAdmin}
              label="auth:authGroups.systemAdmin.label"
              onChange={(value) => {
                const userUpdated = value
                  ? User.assocAuthGroup(systemAdminGroup)(userToUpdate)
                  : User.dissocAuthGroup(systemAdminGroup)(userToUpdate)
                onUpdate(userUpdated)
              }}
            />
          )}
          {canViewSurveyManager && !systemAdmin && (
            <Checkbox
              checked={surveyManager}
              label="auth:authGroups.surveyManager.label"
              onChange={onSurveyManagerChange}
              disabled={!canEdit || !canEditSurveyManager}
            />
          )}
        </div>
      )}
      {canEditMaxSurveys && !systemAdmin && (surveyManager || newUser) && (
        <FormItem label="userView.maxSurveysUserCanCreate">
          <Input
            className="max-surveys-input"
            numberFormat={NumberFormats.integer({ allowNegative: false, allowZero: false, maxLength: 3 })}
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
          {surveyHasExtraProps && (
            <ExpansionPanel
              buttonLabel="usersView.surveyExtraProp.label_other"
              className="extra-props"
              startClosed={Objects.isEmpty(User.getAuthGroupExtraProps(userToUpdate))}
            >
              <UserAuthGroupExtraPropsEditor onChange={onSurveyExtraPropsChange} userToUpdate={userToUpdate} />
            </ExpansionPanel>
          )}
        </>
      )}
      {!userUuid && (
        <UserPasswordSetForm form={userToUpdate} onFieldChange={onPasswordFormFieldChange} validation={validation} />
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
