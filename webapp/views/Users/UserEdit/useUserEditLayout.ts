import * as AuthGroup from '@core/auth/authGroup'
import * as User from '@core/user/user'

import { useUser } from '@webapp/store/user'

import type { AccessSectionVisibility } from './sections/AccessSection'
import type { SignInSecuritySectionVisibility } from './sections/SignInSecuritySection'

type HeaderChip = { key: string; label: string; variant?: 'success' | 'warning' }

type Params = {
  editUser: any
  newUser: boolean
  userUuid?: string
  canUseMap: boolean
  aiFeaturesEnabled: boolean
}

const getAccessVisibility = ({ editUser, newUser, surveyGroupsVisible }): AccessSectionVisibility => {
  const { canViewSystemAdmin, canViewSurveyManager, canEditMaxSurveys, userToUpdate } = editUser
  const systemAdmin = User.isSystemAdmin(userToUpdate)
  const surveyManager = User.isSurveyManager(userToUpdate)
  return {
    roleInSurvey: surveyGroupsVisible && !systemAdmin,
    systemAdmin: canViewSystemAdmin,
    surveyManager: canViewSurveyManager && !systemAdmin,
    maxSurveys: canEditMaxSurveys && !systemAdmin && (surveyManager || newUser),
  }
}

const getSecurityVisibility = ({
  editUser,
  editingLoggedInUser,
  loggedInUserSystemAdmin,
  userUuid,
}): SignInSecuritySectionVisibility => {
  const { canEdit, userToUpdate } = editUser
  return {
    passwordForm: !userUuid,
    signInMethods:
      Boolean(userUuid) && User.hasAccepted(userToUpdate) && (editingLoggedInUser || loggedInUserSystemAdmin),
    changePassword: canEdit && Boolean(userUuid),
    twoFactorDevices: editingLoggedInUser,
  }
}

const getHeaderChips = ({ userToUpdate, showSurveyGroup, groupInCurrentSurvey }): HeaderChip[] => {
  const chips: HeaderChip[] = []
  const systemAdmin = User.isSystemAdmin(userToUpdate)
  if (systemAdmin) {
    chips.push({ key: 'systemAdmin', label: 'auth:authGroups.systemAdmin.label' })
  } else if (showSurveyGroup && groupInCurrentSurvey) {
    const groupName = AuthGroup.getName(groupInCurrentSurvey)
    chips.push({ key: 'surveyGroup', label: `auth:authGroups.${groupName}.label` })
  }
  if (!systemAdmin && User.isSurveyManager(userToUpdate)) {
    chips.push({ key: 'surveyManager', label: 'auth:authGroups.surveyManager.label' })
  }
  if (User.isInvitationExpired(userToUpdate)) {
    chips.push({ key: 'invitation', label: 'usersView:profile.invitationExpiredShort', variant: 'warning' })
  } else if (!User.hasAccepted(userToUpdate)) {
    chips.push({ key: 'invitation', label: 'usersView:notAcceptedYet', variant: 'warning' })
  }
  return chips
}

/**
 * Determines which sections (and parts of them) of the user edit page are visible.
 *
 * @param {object} params - Edit user state and capabilities, plus the features enabled for the logged-in user.
 * @returns {object} Visibility flags and a function to compute the chips shown in the header.
 */
export const useUserEditLayout = (params: Params) => {
  const { editUser, newUser, userUuid, canUseMap, aiFeaturesEnabled } = params
  const loggedInUser = useUser()
  const { user, userToUpdate, showSurveyGroup, canRemove } = editUser

  const editingLoggedInUser = User.isEqual(user)(userToUpdate)
  const loggedInUserSystemAdmin = User.isSystemAdmin(loggedInUser)
  const surveyGroupsVisible = !newUser && showSurveyGroup
  // personal settings are edited only in the own profile, not from the survey users list
  const ownSettingsVisible = editingLoggedInUser && !showSurveyGroup

  const access = getAccessVisibility({ editUser, newUser, surveyGroupsVisible })
  const security = getSecurityVisibility({ editUser, editingLoggedInUser, loggedInUserSystemAdmin, userUuid })

  return {
    access,
    security,
    visible: {
      access: Object.values(access).some(Boolean),
      security: Object.values(security).some(Boolean),
      integrations: ownSettingsVisible && canUseMap,
      // also hidden when the server reports AI features as disabled (see AiFeaturesSection)
      aiFeatures: ownSettingsVisible && aiFeaturesEnabled,
      notifications: ownSettingsVisible && User.isSystemAdmin(userToUpdate),
      removeFromSurvey: surveyGroupsVisible && canRemove,
      invitationExpired: surveyGroupsVisible && User.isInvitationExpired(userToUpdate),
    },
    headerChips: (groupInCurrentSurvey): HeaderChip[] =>
      newUser ? [] : getHeaderChips({ userToUpdate, showSurveyGroup, groupInCurrentSurvey }),
  }
}
