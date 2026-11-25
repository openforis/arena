import './UserEdit.scss'

import { useCallback, useRef, useState } from 'react'
import { useParams } from 'react-router'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { ButtonInvite } from '@webapp/components'
import { useAppDispatch } from '@webapp/store'
import { useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n, useSystemConfigAiFeaturesEnabled } from '@webapp/store/system'
import { UserActions, useUser } from '@webapp/store/user'
import { useAuthCanUseMap } from '@webapp/store/user/hooks'

import { AccessSection } from './sections/AccessSection'
import { AiFeaturesSection } from './sections/AiFeaturesSection'
import { IntegrationsSection } from './sections/IntegrationsSection'
import { NotificationsSection } from './sections/NotificationsSection'
import { PersonalInfoSection } from './sections/PersonalInfoSection'
import { RemoveFromSurveySection } from './sections/RemoveFromSurveySection'
import { SignInSecuritySection } from './sections/SignInSecuritySection'
import { useEditUser } from './store'
import { UserEditHeader } from './UserEditHeader'
import { UserEditNav, UserEditNavItem } from './UserEditNav'
import { UserEditSaveBar } from './UserEditSaveBar'
import { useUserEditLayout } from './useUserEditLayout'

type Props = {
  // true when editing the logged-in user's own profile (route has no userUuid param)
  ownProfile?: boolean
}

// own profile page has no uuid in the URL: resolve it from the logged-in user instead
const useUserUuid = (ownProfile: boolean) => {
  const { userUuid: userUuidParam } = useParams()
  const loggedInUser = useUser()
  const userUuid = userUuidParam || (ownProfile ? User.getUuid(loggedInUser) : undefined)
  return { userUuid, newUser: !userUuidParam && !ownProfile }
}

// notification preferences of the logged-in user, saved together with the other changes
const useNotificationPrefs = (user) => {
  const dispatch = useAppDispatch()
  const [dirty, setDirty] = useState(false)
  const [notifyOnUserAccessRequest, setNotifyOnUserAccessRequest] = useState(() =>
    User.getPrefNotifyOnUserAccessRequest(user)
  )
  const onNotifyOnUserAccessRequestChange = useCallback((value: boolean) => {
    setNotifyOnUserAccessRequest(value)
    setDirty(true)
  }, [])
  const save = useCallback(async () => {
    await dispatch(
      UserActions.updateUserPrefs({
        user: User.assocPrefNotifyOnUserAccessRequest(notifyOnUserAccessRequest)(user),
      }) as any
    )
    setDirty(false)
  }, [dispatch, notifyOnUserAccessRequest, user])
  return { dirty, notifyOnUserAccessRequest, onNotifyOnUserAccessRequestChange, save }
}

const UserEdit = (props: Props) => {
  const { ownProfile = false } = props
  const { userUuid, newUser } = useUserUuid(ownProfile)
  const loggedInUser = useUser()
  const i18n = useI18n()

  const editUser: any = useEditUser({ userUuid })
  const {
    ready,
    dirty,
    user,
    userToUpdate,
    canEdit,
    canSave,
    canViewEmail,
    onInviteRepeat,
    onRemove,
    onSave,
    onUpdate,
    onUpdateProfilePicture,
  } = editUser

  const aiSaveRef = useRef<() => Promise<void>>(null)
  const [aiSettingsDirty, setAiSettingsDirty] = useState(false)
  const [aiFeaturesAvailable, setAiFeaturesAvailable] = useState(false)
  const notificationPrefs = useNotificationPrefs(user)

  const surveyInfo = useSurveyInfo()
  const surveyLang = useSurveyPreferredLang()
  const surveyUuid = Survey.getUuid(surveyInfo)
  const canUseMap = useAuthCanUseMap()
  const aiFeaturesEnabled = useSystemConfigAiFeaturesEnabled()

  const layout = useUserEditLayout({ editUser, newUser, userUuid, canUseMap, aiFeaturesEnabled })

  const onSaveAll = useCallback(async () => {
    const saves = []
    // the AI and notification preferences save on their own: invalid profile fields must not block them
    if (dirty && canSave) saves.push(onSave())
    if (aiSettingsDirty) saves.push(aiSaveRef.current?.())
    if (notificationPrefs.dirty) saves.push(notificationPrefs.save())
    await Promise.all(saves)
  }, [aiSettingsDirty, canSave, dirty, notificationPrefs, onSave])

  if (!ready) return null

  const validation = canEdit ? User.getValidation(userToUpdate) : null
  const editingLoggedInUser = User.isEqual(user)(userToUpdate)
  const groupInCurrentSurvey = User.getAuthGroupBySurveyUuid({ surveyUuid })(userToUpdate)
  const { visible } = layout

  const navItems: UserEditNavItem[] = [
    { id: 'user-edit-personal', label: 'usersView:profile.sections.personal', visible: true },
    { id: 'user-edit-access', label: 'usersView:profile.sections.access', visible: visible.access },
    { id: 'user-edit-security', label: 'usersView:profile.sections.security', visible: visible.security },
    { id: 'user-edit-integrations', label: 'usersView:profile.sections.integrations', visible: visible.integrations },
    {
      id: 'user-edit-ai-features',
      label: 'userAiSettings:section',
      visible: visible.aiFeatures && aiFeaturesAvailable,
    },
    { id: 'user-edit-notifications', label: 'usersView:prefs.title', visible: visible.notifications },
    { id: 'user-edit-remove', label: 'userView.removeFromSurvey', visible: visible.removeFromSurvey },
  ].filter((item) => item.visible)

  const saveBarVisible = canEdit && (newUser || dirty || aiSettingsDirty || notificationPrefs.dirty)

  return (
    <div className="user-edit" key={userUuid}>
      {navItems.length > 2 && <UserEditNav items={navItems} />}
      <div className="user-edit__content">
        {visible.invitationExpired && (
          <output className="user-edit__banner">
            <span>{i18n.t('usersView:profile.invitationExpired')}</span>
            <ButtonInvite className="btn-invite" onClick={onInviteRepeat} />
          </output>
        )}
        <UserEditHeader
          canEdit={canEdit}
          chips={layout.headerChips(groupInCurrentSurvey)}
          onPictureUpdate={(profilePicture) => onUpdateProfilePicture({ profilePicture })}
          showEmail={canViewEmail}
          userToUpdate={userToUpdate}
          userUuid={userUuid}
        />
        <PersonalInfoSection
          canEdit={canEdit}
          canEditEmail={editUser.canEditEmail}
          canEditName={editUser.canEditName}
          canViewEmail={canViewEmail}
          editingLoggedInUser={editingLoggedInUser}
          onExtraChange={editUser.onExtraChange}
          onNameChange={editUser.onNameChange}
          onUpdate={onUpdate}
          userToUpdate={userToUpdate}
          validation={validation}
        />
        {visible.access && (
          <AccessSection
            canEdit={canEdit}
            canEditGroup={editUser.canEditGroup}
            canEditSurveyManager={editUser.canEditSurveyManager}
            canEditSystemAdmin={editUser.canEditSystemAdmin}
            groupInCurrentSurvey={groupInCurrentSurvey}
            onSurveyAuthGroupChange={editUser.onSurveyAuthGroupChange}
            onSurveyManagerChange={editUser.onSurveyManagerChange}
            onUpdate={onUpdate}
            systemAdminGroup={User.getAuthGroupByName(AuthGroup.groupNames.systemAdmin)(user)}
            userToUpdate={userToUpdate}
            validation={validation}
            visibility={layout.access}
          />
        )}
        {visible.security && (
          <SignInSecuritySection
            editingLoggedInUser={editingLoggedInUser}
            loggedInUserSystemAdmin={User.isSystemAdmin(loggedInUser)}
            onChangePasswordClick={editUser.onChangePasswordClick}
            onManage2FADevicesClick={editUser.onManage2FADevicesClick}
            onPasswordFormFieldChange={editUser.onPasswordFormFieldChange}
            userToUpdate={userToUpdate}
            userUuid={userUuid}
            validation={validation}
            visibility={layout.security}
          />
        )}
        {visible.integrations && (
          <IntegrationsSection
            canEditMapApiKeys={editUser.canEditEmail}
            onMapApiKeyTest={editUser.onMapApiKeyTest}
            onUpdate={onUpdate}
            userToUpdate={userToUpdate}
            validation={validation}
          />
        )}
        {visible.aiFeatures && (
          <AiFeaturesSection
            aiSaveRef={aiSaveRef}
            available={aiFeaturesAvailable}
            onAvailableChange={setAiFeaturesAvailable}
            onDirtyChange={setAiSettingsDirty}
          />
        )}
        {visible.notifications && (
          <NotificationsSection
            notifyOnUserAccessRequest={notificationPrefs.notifyOnUserAccessRequest}
            onNotifyOnUserAccessRequestChange={notificationPrefs.onNotifyOnUserAccessRequestChange}
          />
        )}
        {visible.removeFromSurvey && (
          <RemoveFromSurveySection onRemove={onRemove} surveyName={Survey.getLabel(surveyInfo, surveyLang)} />
        )}
        {saveBarVisible && (
          <UserEditSaveBar
            canSave={(dirty && canSave) || aiSettingsDirty || notificationPrefs.dirty}
            onSave={onSaveAll}
          />
        )}
      </div>
    </div>
  )
}

export default UserEdit
