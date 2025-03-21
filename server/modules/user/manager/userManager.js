import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import { db } from '@server/db/db'

import * as ActivityLog from '@common/activityLog/activityLog'

import { Countries } from '@core/Countries'
import * as User from '@core/user/user'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as AuthGroup from '@core/auth/authGroup'
import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'
import * as PromiseUtils from '@core/promiseUtils'
import * as StringUtils from '@core/stringUtils'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import * as UserResetPasswordRepository from '@server/modules/user/repository/userResetPasswordRepository'
import * as UserAccessRequestRepository from '@server/modules/user/repository/userAccessRequestRepository'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as UserInvitationManager from './userInvitationManager'

const { groupNames } = AuthGroup

export const {
  countUsers,
  countUsersBySurveyId,
  countSystemAdministrators,
  fetchUserProfilePicture,
  fetchSystemAdministratorsEmail,
  fetchUsersIntoStream,
  fetchActiveUserUuidsWithPreferredSurveyId,
  fetchUsersWithExpiredInvitation,
  updateNamePasswordAndStatus,
  updatePassword,
  resetUsersPrefsSurveyCycle,
  importNewUser,
  deleteUser,
  deleteUsersWithExpiredInvitation,
} = UserRepository

export const {
  fetchResetPasswordUuidByUserUuid,
  findResetPasswordUserUuidByUuid,
  deleteUserResetPasswordByUuid,
  deleteUserResetPasswordExpired,
} = UserResetPasswordRepository

export const { fetchSurveyIdsOfExpiredInvitationUsers } = AuthGroupRepository

// ==== CREATE
const _determineGroupsToAddTo = async ({ user, userToAdd, group, surveyInfo }, client = db) => {
  const groupsToAdd = []
  if (
    (AuthGroup.isSurveyManagerGroup(group) || AuthGroup.getName(group) === groupNames.surveyAdmin) &&
    !User.isSurveyManager(userToAdd)
  ) {
    const surveyManagerGroup = await AuthGroupRepository.fetchGroupByName({ name: groupNames.surveyManager }, client)
    groupsToAdd.push(surveyManagerGroup)
  }
  if (AuthGroup.isSurveyGroup(group)) {
    groupsToAdd.push(group)
  } else if (AuthGroup.isSystemAdminGroup(group) && User.isSystemAdmin(user) && !User.isSystemAdmin(userToAdd)) {
    groupsToAdd.push(User.getSystemAdminGroup(user))
  } else if (AuthGroup.isSurveyManagerGroup(group)) {
    // accepting user access request
    // when adding user to survey manager group, make him survey admin of the specified survey
    groupsToAdd.push(Survey.getAuthGroupAdmin(surveyInfo))
  }
  return groupsToAdd
}

export const addUserToGroup = async ({ user, surveyInfo, group, userToAdd }, client = db) =>
  client.tx(async (t) => {
    const surveyId = Survey.getIdSurveyInfo(surveyInfo)
    const userUuid = User.getUuid(userToAdd)
    const groupsToAdd = await _determineGroupsToAddTo({ user, userToAdd, group, surveyInfo }, t)
    await PromiseUtils.each(groupsToAdd, async (groupToAdd) => {
      const groupUuid = groupToAdd.uuid
      await AuthGroupRepository.insertUserGroup({ groupUuid, userUuid }, t)

      if (AuthGroup.isSurveyGroup(groupToAdd)) {
        await ActivityLogRepository.insert(
          user,
          surveyId,
          ActivityLog.type.userInvite,
          {
            [ActivityLog.keysContent.uuid]: userUuid,
            [ActivityLog.keysContent.groupUuid]: groupUuid,
          },
          false,
          t
        )
      }
    })
  })

export const insertUser = async (
  { user, surveyInfo, surveyCycleKey, email, password, status, group, title },
  client = db
) =>
  client.tx(async (t) => {
    const surveyId = Survey.getIdSurveyInfo(surveyInfo)

    const newUser = await UserRepository.insertUser(
      {
        surveyId,
        surveyCycleKey,
        email,
        password,
        status,
        title,
      },
      t
    )
    await addUserToGroup({ user, surveyInfo, group, userToAdd: newUser }, t)

    // accept user access request (if any)
    await UserAccessRequestRepository.updateUserAccessRequestStatus(
      {
        email,
        status: UserAccessRequest.status.ACCEPTED,
        userUuid: User.getUuid(user),
      },
      t
    )

    return newUser
  })

export const insertSystemAdminUser = async ({ email, password }, client = db) =>
  client.tx(async (t) => {
    const status = User.userStatus.ACCEPTED
    const newUser = await UserRepository.insertUser({ email, password, status }, t)
    const userUuid = User.getUuid(newUser)
    const sysAdminGroup = await AuthGroupRepository.fetchGroupByName({ name: groupNames.systemAdmin }, t)
    const systemAdminGroupUuid = AuthGroup.getUuid(sysAdminGroup)
    await AuthGroupRepository.insertUserGroup({ groupUuid: systemAdminGroupUuid, userUuid }, t)
  })

export const generateResetPasswordUuid = async (email, client = db) => {
  const user = await UserRepository.fetchUserByEmail(email, client)
  if (!user) {
    throw new Error(Validation.messageKeys.user.emailNotFound)
  }
  // if (User.isInvited(user)) {
  //   throw new Error(Validation.messageKeys.user.passwordResetNotAllowedWithPendingInvitation)
  // }
  const uuid = await UserResetPasswordRepository.insertOrUpdateResetPassword(User.getUuid(user), client)
  return { uuid, user }
}

export { insertUserAccessRequest } from '../repository/userAccessRequestRepository'

// ==== READ

const _attachAuthGroupsAndInvitationToUser = async ({ user, invitationsByUserUuid = {}, userGroups = [], t }) => {
  // Assoc auth groups

  const _userGroups = R.isEmpty(userGroups)
    ? await AuthGroupRepository.fetchUserGroups(User.getUuid(user), t)
    : userGroups
  let userUpdated = User.assocAuthGroups(_userGroups)(user)

  if (User.isInvited(userUpdated)) {
    const userUuid = User.getUuid(userUpdated)
    const invitation = invitationsByUserUuid[userUuid]
    const invitationValid =
      invitation || (await UserResetPasswordRepository.existsResetPasswordValidByUserUuid(userUuid, t))
    userUpdated = User.assocInvitationExpired(!invitationValid)(userUpdated)
  }

  return userUpdated
}

const _attachAuthGroupsAndInvitationToUsers = async ({ users, invitationsByUserUuid = {}, t }) => {
  if (users.length === 0) return users

  const usersUuids = users.map(User.getUuid)

  const authGroups = await AuthGroupRepository.fetchUsersGroups(usersUuids, t)

  return Promise.all(
    users.map((user) =>
      _attachAuthGroupsAndInvitationToUser({
        user,
        invitationsByUserUuid,
        userGroups: authGroups.filter((group) => group.userUuid === User.getUuid(user)),
        t,
      })
    )
  )
}

const _userFetcher =
  (fetchFn) =>
  async (...args) => {
    const user = await fetchFn(...args)
    return user ? _attachAuthGroupsAndInvitationToUser({ user }) : null
  }

export const fetchUserByEmail = _userFetcher(UserRepository.fetchUserByEmail)

export const fetchUserByUuid = _userFetcher(UserRepository.fetchUserByUuid)

export const fetchUserByUuidWithPassword = _userFetcher(UserRepository.fetchUserByUuidWithPassword)

export const fetchUsers = async (
  { offset, onlyAccepted = false, limit, search = null, sortBy, sortOrder },
  client = db
) =>
  client.tx(async (t) => {
    const users = (await UserRepository.fetchUsers({ offset, onlyAccepted, limit, search, sortBy, sortOrder }, t)).map(
      User.dissocPrivateProps
    )
    return _attachAuthGroupsAndInvitationToUsers({ users, t })
  })

export const fetchUsersBySurveyId = async (
  { surveyId, offset = 0, limit = null, onlyAccepted = false, includeSystemAdmins = false },
  client = db
) =>
  client.tx(async (t) => {
    const users = (await UserRepository.fetchUsersBySurveyId({ surveyId, offset, limit, includeSystemAdmins }, t)).map(
      User.dissocPrivateProps
    )
    const usersFiltered = users.filter((user) => !onlyAccepted || User.hasAccepted(user))
    const usersUuids = usersFiltered.map(User.getUuid)
    const invitations =
      usersUuids.length > 0 ? await UserResetPasswordRepository.existResetPasswordValidByUserUuids(usersUuids, t) : []
    const invitationsByUserUuid = invitations.reduce((acc, invitation) => {
      acc[invitation.user_uuid] = invitation.result
      return acc
    }, {})
    return _attachAuthGroupsAndInvitationToUsers({ users: usersFiltered, invitationsByUserUuid, t })
  })

export const findUserByEmailAndPassword = async (email, password, passwordCompareFn) => {
  const user = await UserRepository.fetchUserAndPasswordByEmail(email)

  if (user && (await passwordCompareFn(password, user.password)))
    return _attachAuthGroupsAndInvitationToUser({ user: R.dissoc('password', user) })

  return null
}

export {
  countUserAccessRequests,
  fetchUserAccessRequests,
  fetchUserAccessRequestByUuid,
  fetchUserAccessRequestByEmail,
  deleteUserAccessRequestsByEmail,
  deleteExpiredUserAccessRequests,
} from '../repository/userAccessRequestRepository'

export const exportUserAccessRequestsIntoStream = async ({ outputStream, fileFormat }) => {
  const fields = [
    'email',
    ...Object.values(UserAccessRequest.keysProps).map(StringUtils.toSnakeCase),
    'status',
    'date_created',
  ]

  const objectTransformer = (obj) => ({
    ...obj,
    // expand props into separate columns
    ...Object.values(UserAccessRequest.keysProps).reduce((acc, prop) => {
      const header = StringUtils.toSnakeCase(prop)
      const value = obj.props[prop]
      // export country name instead of code
      const valueTransformed =
        prop === UserAccessRequest.keysProps.country ? Countries.getCountryName({ code: value }) : value
      return {
        ...acc,
        [header]: valueTransformed,
      }
    }, {}),
    // format date_created
    date_created: DateUtils.formatDateTimeDefault(obj.date_created),
  })

  await UserAccessRequestRepository.fetchUserAccessRequestsAsStream({
    processor: (dbStream) =>
      FlatDataWriter.writeItemsStreamToStream({
        stream: dbStream,
        outputStream,
        fields,
        options: { objectTransformer },
        fileFormat,
      }),
  })
}

// ==== UPDATE

const _insertOrDeleteUserGroup = async ({ userUuid, authGroupsNew, userToUpdateOld, groupName }, client = db) => {
  const group = User.getAuthGroupByName(groupName)(userToUpdateOld)
  if (group) {
    // user previously associated to the group: remove user from group
    await AuthGroupRepository.deleteUserGroupByUserAndGroupUuid(
      { userUuid, groupUuid: AuthGroup.getUuid(group) },
      client
    )
  } else {
    // add user to the new group
    const groupNew = authGroupsNew.find((authGroup) => AuthGroup.getName(authGroup) === groupName)
    await AuthGroupRepository.insertUserGroup({ groupUuid: AuthGroup.getUuid(groupNew), userUuid }, client)
  }
}

const _updateUser = async (user, surveyId, userToUpdate, profilePicture, client = db) =>
  client.tx(async (t) => {
    const userUuid = User.getUuid(userToUpdate)
    const userToUpdateOld = await fetchUserByUuid(userUuid, t)
    const authGroupsUuidsNew = User.getAuthGroupsUuids(userToUpdate)

    const authGroupsNew = await AuthGroupRepository.fetchGroupsByUuids(authGroupsUuidsNew, t)

    // if user admin role changed, insert or delete the user auth group
    const userToUpdateWillBeSystemAdmin = authGroupsNew.some(AuthGroup.isSystemAdminGroup)
    if (userToUpdateWillBeSystemAdmin !== User.isSystemAdmin(userToUpdateOld)) {
      if (userToUpdateWillBeSystemAdmin) {
        // user will be system admin: delete all user groups and set his new group to SystemAdmin
        await AuthGroupRepository.deleteAllUserGroups(userUuid, t)
      }
      const groupName = groupNames.systemAdmin
      await _insertOrDeleteUserGroup({ userUuid, authGroupsNew, userToUpdateOld, groupName }, t)
    }
    // if user survey manager role changed, insert or delete the user auth group
    const userToUpdateWillBeSurveyManager = authGroupsNew.some(AuthGroup.isSurveyManagerGroup)
    if (userToUpdateWillBeSurveyManager !== User.isSurveyManager(userToUpdateOld)) {
      const groupName = groupNames.surveyManager
      await _insertOrDeleteUserGroup({ userUuid, authGroupsNew, userToUpdateOld, groupName }, t)
    }

    // insert or update user survey auth group relation
    if (surveyId && !userToUpdateWillBeSystemAdmin) {
      const surveyAuthGroupNew = authGroupsNew.find((authGroup) => AuthGroup.getSurveyId(authGroup) === surveyId)
      const surveyUuid = AuthGroup.getSurveyUuid(surveyAuthGroupNew)
      const groupUuid = AuthGroup.getUuid(surveyAuthGroupNew)
      const surveyAuthGroupOld = User.getAuthGroupBySurveyUuid({ surveyUuid })(userToUpdateOld)
      let authGroupProps = null
      const authGroupExtraProps = User.getAuthGroupExtraProps(userToUpdate)
      if (Objects.isNotEmpty(authGroupExtraProps)) {
        authGroupProps = { extra: authGroupExtraProps }
      }
      if (surveyAuthGroupOld) {
        await AuthGroupRepository.updateUserGroup({ surveyId, userUuid, groupUuid, props: authGroupProps }, t)
      } else {
        await AuthGroupRepository.insertUserGroup({ groupUuid, userUuid }, t)
      }
      // Log user update activity only for non system admin users
      await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.userUpdate, userToUpdate, false, t)
    }

    // update user props and picture
    const userToUpdateModified = User.isSystemAdmin(user)
      ? userToUpdate
      : // restricted props can be updated only by system admins
        User.dissocRestrictedProps(userToUpdate)
    const name = User.getName(userToUpdateModified)
    const email = User.getEmail(userToUpdateModified)
    const props = User.getProps(userToUpdateModified)

    return UserRepository.updateUser(
      {
        userUuid,
        name,
        email,
        profilePicture,
        props,
      },
      t
    )
  })

export const updateUser = _userFetcher(_updateUser)

export const updateUserPrefs = async (user) => UserRepository.updateUserPrefs(user)

export const updateUserPrefsAndFetchGroups = async (user) => ({
  ...(await updateUserPrefs(user)),
  [User.keys.authGroups]: await AuthGroupRepository.fetchUserGroups(User.getUuid(user)),
})

// ==== DELETE

export const deleteUserFromSurvey = async ({ user, userUuidToRemove, survey }, client = db) =>
  client.tx(async (t) => {
    const surveyId = Survey.getId(survey)
    const surveyUuid = Survey.getUuid(Survey.getSurveyInfo(survey))
    return Promise.all([
      AuthGroupRepository.deleteUserGroupBySurveyAndUser(surveyId, userUuidToRemove, t),
      ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.userRemove,
        { [ActivityLog.keysContent.uuid]: userUuidToRemove },
        false,
        t
      ),
      UserInvitationManager.updateRemovedDate({ surveyUuid, userUuidToRemove }, t),
    ])
  })
