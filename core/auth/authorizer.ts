import {
  ArenaRecord,
  Survey as ArenaSurvey,
  Surveys,
  User as ArenaUser,
  AuthGroup as ArenaAuthGroup,
} from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'

const { permissions, keys } = AuthGroup

const _getSurveyUserGroup = (user: ArenaUser, surveyInfo: ArenaSurvey): ArenaAuthGroup | null => {
  const surveyUuid = Survey.getUuid(surveyInfo)
  return User.getAuthGroupBySurveyUuid({ surveyUuid })(user)
}

const _hasAuthGroupForSurvey = ({ user, surveyInfo }: { user: ArenaUser; surveyInfo: ArenaSurvey }): boolean =>
  Boolean(_getSurveyUserGroup(user, surveyInfo))

const _hasSurveyPermission =
  (permission: string) =>
  (user: ArenaUser, surveyInfo: ArenaSurvey): boolean => {
    if (!user) return false

    if (User.isSystemAdmin(user)) return true

    if (!surveyInfo) return false

    const authGroup = _getSurveyUserGroup(user, surveyInfo)
    if (!authGroup) return false

    return AuthGroup.getPermissions(authGroup).includes(permission)
  }

const _hasPermissionInSomeGroup =
  (permission: string) =>
  (user: ArenaUser): boolean => {
    if (User.isSystemAdmin(user)) return true
    const groups = User.getAuthGroups(user)
    return groups.some((group: ArenaAuthGroup) => AuthGroup.getPermissions(group).includes(permission))
  }

export const canCreateSurvey = _hasPermissionInSomeGroup(permissions.surveyCreate)
export const canCreateTemplate = (user: ArenaUser): boolean => User.isSystemAdmin(user)
export const getMaxSurveysUserCanCreate = (user: ArenaUser): number => {
  if (User.isSystemAdmin(user)) return NaN
  if (canCreateSurvey(user)) return User.getMaxSurveys(user)
  return 0
}

export const canViewSurvey = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
  User.isSystemAdmin(user) || _hasAuthGroupForSurvey({ user, surveyInfo })
export const canExportSurvey = _hasSurveyPermission(permissions.recordAnalyse)
export const canExportSurveysList = (user: ArenaUser): boolean => User.isSystemAdmin(user)
export const canViewTemplates = (user: ArenaUser): boolean => User.isSystemAdmin(user)

export const canEditSurvey = _hasSurveyPermission(permissions.surveyEdit)
export const canEditSurveyConfig = (user: ArenaUser): boolean => User.isSystemAdmin(user)
export const canEditSurveyOwner = (user: ArenaUser): boolean => User.isSystemAdmin(user)
export const canEditTemplates = (user: ArenaUser): boolean => User.isSystemAdmin(user)
export const canRefreshAllSurveyRdbs = (user: ArenaUser): boolean => User.isSystemAdmin(user)

export const canCreateRecord = _hasSurveyPermission(permissions.recordCreate)

export const canViewRecord = _hasSurveyPermission(permissions.recordView)
export const canExportAllRecords = _hasSurveyPermission(permissions.recordCleanse)
export const canViewNotOwnedRecords = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean => {
  if (!canViewSurvey(user, surveyInfo)) return false
  if (canExportAllRecords(user, surveyInfo)) return true
  const surveyUuid = Survey.getUuid(surveyInfo)
  const groupInCurrentSurvey = User.getAuthGroupBySurveyUuid({ surveyUuid })(user)
  return (
    AuthGroup.getName(groupInCurrentSurvey as ArenaAuthGroup) === AuthGroup.groupNames.dataEditor &&
    Surveys.isDataEditorViewNotOwnedRecordsAllowed(surveyInfo as any)
  )
}
export const canExportRecordsList = _hasSurveyPermission(permissions.surveyEdit)

export const canEditRecord = (user: ArenaUser, record: ArenaRecord, ignoreRecordStep: boolean = false): boolean => {
  if (!user || !record || (!ignoreRecordStep && Record.isInAnalysisStep(record))) {
    return false
  }
  if (User.isSystemAdmin(user)) {
    return true
  }
  const userAuthGroup = User.getAuthGroupBySurveyUuid({ surveyUuid: Record.getSurveyUuid(record) })(user)
  if (!userAuthGroup) return false

  const level = AuthGroup.getRecordEditLevel(Record.getStep(record))(userAuthGroup)
  return level === keys.all || (level === keys.own && Record.getOwnerUuid(record) === User.getUuid(user))
}

const canChangeRecordProps = (user: ArenaUser, record: ArenaRecord): boolean => canEditRecord(user, record, true)

export const canDeleteRecord = canEditRecord

export const canDemoteRecord = canChangeRecordProps

export const canChangeRecordOwner = canChangeRecordProps

export const canChangeRecordStep = canChangeRecordProps

export const canCleanseRecords = _hasSurveyPermission(permissions.recordCleanse)

export const canExportRecords = _hasSurveyPermission(permissions.recordView)

export const canImportRecords = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
  Survey.isPublished(surveyInfo as any) && _hasSurveyPermission(permissions.recordCreate)(user, surveyInfo)

export const canAnalyzeRecords = _hasSurveyPermission(permissions.recordAnalyse)

export const canUpdateRecordsStep = canAnalyzeRecords

export const canUseExplorer = canCleanseRecords

export const canUseMap = canAnalyzeRecords

export const canInviteUsers = _hasSurveyPermission(permissions.userInvite)

export const canViewSurveyUsers = _hasSurveyPermission(permissions.userInvite)

const _usersBelongToSameSurvey = ({ user, userToView }: { user: ArenaUser; userToView: ArenaUser }): boolean =>
  User.getAuthGroups(user).some(
    (authGroupUser: ArenaAuthGroup) =>
      AuthGroup.isSurveyGroup(authGroupUser) &&
      User.getAuthGroups(userToView).some(
        (authGroupUserToView: ArenaAuthGroup) =>
          AuthGroup.isSurveyGroup(authGroupUserToView) &&
          AuthGroup.getSurveyUuid(authGroupUserToView) === AuthGroup.getSurveyUuid(authGroupUser)
      )
  )

export const canViewUser = (user: ArenaUser, surveyInfo: ArenaSurvey, userToView: ArenaUser): boolean =>
  User.isSystemAdmin(user) ||
  User.isEqual(userToView as Record<string, any>)(user as Record<string, any>) ||
  _usersBelongToSameSurvey({ user, userToView, surveyInfo } as any)

export const canViewOtherUsersEmail = ({ user, surveyInfo }: { user: ArenaUser; surveyInfo: ArenaSurvey }): boolean =>
  User.isSystemAdmin(user) || canInviteUsers(user, surveyInfo)

export const canViewOtherUsersNameInSameSurvey = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
  _hasSurveyPermission(permissions.recordView)(user, surveyInfo)

export const canViewAllUsers = (user: ArenaUser): boolean => User.isSystemAdmin(user)

const _hasUserEditAccess = (user: ArenaUser, surveyInfo: ArenaSurvey, userToUpdate: ArenaUser): boolean =>
  User.isSystemAdmin(user) ||
  (_hasSurveyPermission(permissions.userEdit)(user, surveyInfo) &&
    _hasAuthGroupForSurvey({ user: userToUpdate, surveyInfo }))

export const canCreateUsers = (user: ArenaUser): boolean => User.isSystemAdmin(user)

export const canEditUser = (user: ArenaUser, surveyInfo: ArenaSurvey, userToUpdate: ArenaUser): boolean =>
  User.hasAccepted(userToUpdate) &&
  (User.isEqual(user as Record<string, any>)(userToUpdate as Record<string, any>) ||
    _hasUserEditAccess(user, surveyInfo, userToUpdate))

export const canEditUserEmail = (user: ArenaUser): boolean => User.isSystemAdmin(user)

export const canEditUserGroup = (user: ArenaUser, surveyInfo: ArenaSurvey, userToUpdate: ArenaUser): boolean =>
  !User.isEqual(user as Record<string, any>)(userToUpdate as Record<string, any>) &&
  _hasUserEditAccess(user, surveyInfo, userToUpdate)

export const canRemoveUser = (user: ArenaUser, surveyInfo: ArenaSurvey, userToRemove: ArenaUser): boolean =>
  !User.isEqual(user as Record<string, any>)(userToRemove as Record<string, any>) &&
  !User.isSystemAdmin(userToRemove) &&
  _hasUserEditAccess(user, surveyInfo, userToRemove)

export const canEditUserSurveyManager = (user: ArenaUser): boolean => User.isSystemAdmin(user)
export const canEditUserMaxSurveys = (user: ArenaUser): boolean => User.isSystemAdmin(user)

export const canViewUsersAccessRequests = (user: ArenaUser): boolean => User.isSystemAdmin(user)
export const canEditUsersAccessRequests = (user: ArenaUser): boolean => User.isSystemAdmin(user)

export const canManageUser2FADevices = (user: ArenaUser): boolean => User.isSystemAdmin(user)

export const getUserGroupsCanAssign = ({
  user,
  surveyInfo = null,
  editingLoggedUser = false,
  showOnlySurveyGroups = false,
}: {
  user: ArenaUser
  surveyInfo?: ArenaSurvey
  editingLoggedUser?: boolean
  showOnlySurveyGroups?: boolean
}): ArenaAuthGroup[] => {
  const groups: ArenaAuthGroup[] = []

  let surveyGroups
  if (editingLoggedUser && !surveyInfo) {
    surveyGroups = []
  } else if (Survey.isPublished(surveyInfo as any)) {
    surveyGroups = Survey.getAuthGroups(surveyInfo)
  } else {
    surveyGroups = [Survey.getAuthGroupAdmin(surveyInfo)]
  }

  surveyGroups = surveyGroups.filter((group) => AuthGroup.getName(group) !== AuthGroup.groupNames.surveyEditor)

  groups.push(...surveyGroups)

  if (!showOnlySurveyGroups && (User.isSystemAdmin(user) || User.isSurveyManager(user))) {
    const userNonSurveyGroups = User.getAuthGroups(user).filter((group) => !AuthGroup.isSurveyGroup(group))
    groups.push(...userNonSurveyGroups)
  }
  return AuthGroup.sortGroups(groups)
}
