import * as R from 'ramda'

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
import * as CSVWriter from '@server/utils/file/csvWriter'
import * as UserInvitationManager from './userInvitationManager'

export const {
  countUsers,
  countUsersBySurveyId,
  countSystemAdministrators,
  fetchUserProfilePicture,
  fetchSystemAdministratorsEmail,
  fetchUsersIntoStream,
  fetchActiveUserUuidsWithPreferredSurveyId,
  updateNamePasswordAndStatus,
  updatePassword,
  resetUsersPrefsSurveyCycle,
  importNewUser,
  deleteUsersWithExpiredInvitation,
} = UserRepository

export const { findResetPasswordUserUuidByUuid, deleteUserResetPasswordByUuid, deleteUserResetPasswordExpired } =
  UserResetPasswordRepository

export const { fetchSurveyIdsOfExpiredInvitationUsers } = AuthGroupRepository

// ==== CREATE

export const addUserToGroup = async ({ user, surveyInfo, group, userToAdd }, client = db) =>
  client.tx(async (t) => {
    const surveyId = Survey.getIdSurveyInfo(surveyInfo)
    const groupsToAdd = []
    if (!AuthGroup.isSurveyManagerGroup(group) || !User.isSurveyManager(userToAdd)) {
      groupsToAdd.push(group)
    }
    if (AuthGroup.isSurveyManagerGroup(group)) {
      // when adding user to survey manager group, make him survey admin of the specified survey
      groupsToAdd.push(Survey.getAuthGroupAdmin(surveyInfo))
    }
    await PromiseUtils.each(groupsToAdd, async (groupToAdd) => {
      const groupUuid = groupToAdd.uuid
      await AuthGroupRepository.insertUserGroup(groupUuid, User.getUuid(userToAdd), t)

      if (AuthGroup.isSurveyGroup(groupToAdd)) {
        await ActivityLogRepository.insert(
          user,
          surveyId,
          ActivityLog.type.userInvite,
          {
            [ActivityLog.keysContent.uuid]: User.getUuid(userToAdd),
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
    const newUser = await UserRepository.insertUser(
      {
        email,
        password,
        status: User.userStatus.ACCEPTED,
      },
      t
    )
    const sysAdminGroup = await AuthGroupRepository.fetchGroupByName({ name: AuthGroup.groupNames.systemAdmin }, t)
    await AuthGroupRepository.insertUserGroup(AuthGroup.getUuid(sysAdminGroup), User.getUuid(newUser), t)
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

export const fetchUsers = async ({ offset, limit, sortBy, sortOrder }, client = db) =>
  client.tx(async (t) => {
    const users = (await UserRepository.fetchUsers({ offset, limit, sortBy, sortOrder }, t)).map(
      User.dissocPrivateProps
    )
    return _attachAuthGroupsAndInvitationToUsers({ users, t })
  })

export const fetchUsersBySurveyId = async (
  { surveyId, offset = 0, limit = null, isSystemAdmin = false },
  client = db
) =>
  client.tx(async (t) => {
    const users = (await UserRepository.fetchUsersBySurveyId(surveyId, offset, limit, isSystemAdmin, t)).map(
      User.dissocPrivateProps
    )
    const usersUuids = users.map(User.getUuid)
    const invitations = await UserResetPasswordRepository.existResetPasswordValidByUserUuids(usersUuids, t)
    const invitationsByUserUuid = invitations.reduce(
      (_invitationsByUserUuid, invitation) => ({
        ..._invitationsByUserUuid,
        [invitation.user_uuid]: invitation.result,
      }),
      {}
    )

    return _attachAuthGroupsAndInvitationToUsers({ users, invitationsByUserUuid, t })
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

export const exportUserAccessRequestsIntoStream = async ({ outputStream }) => {
  const headers = [
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

  const transformer = CSVWriter.transformJsonToCsv({ fields: headers, options: { objectTransformer } })
  transformer.pipe(outputStream)

  await UserAccessRequestRepository.fetchUserAccessRequestsAsStream({ transformer })
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
    await AuthGroupRepository.insertUserGroup(AuthGroup.getUuid(groupNew), userUuid, client)
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
      const groupName = AuthGroup.groupNames.systemAdmin
      await _insertOrDeleteUserGroup({ userUuid, authGroupsNew, userToUpdateOld, groupName }, t)
    }
    // if user survey manager role changed, insert or delete the user auth group
    const userToUpdateWillBeSurveyManager = authGroupsNew.some(AuthGroup.isSurveyManagerGroup)
    if (userToUpdateWillBeSurveyManager !== User.isSurveyManager(userToUpdateOld)) {
      const groupName = AuthGroup.groupNames.surveyManager
      await _insertOrDeleteUserGroup({ userUuid, authGroupsNew, userToUpdateOld, groupName }, t)
    }

    // insert or update user survey auth group relation
    if (surveyId && !userToUpdateWillBeSystemAdmin) {
      const surveyAuthGroupNew = authGroupsNew.find((authGroup) => AuthGroup.getSurveyId(authGroup) === surveyId)
      const surveyUuid = AuthGroup.getSurveyUuid(surveyAuthGroupNew)
      const groupUuid = AuthGroup.getUuid(surveyAuthGroupNew)
      const surveyAuthGroupOld = User.getAuthGroupBySurveyUuid({ surveyUuid })(userToUpdateOld)
      if (!AuthGroup.isEqual(surveyAuthGroupNew)(surveyAuthGroupOld)) {
        if (surveyAuthGroupOld) {
          await AuthGroupRepository.updateUserGroup(surveyId, userUuid, groupUuid, t)
        } else {
          await AuthGroupRepository.insertUserGroup(groupUuid, userUuid, t)
        }
        // Log user update activity only for non system admin users
        await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.userUpdate, userToUpdate, false, t)
      }
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

export const deleteUser = async ({ user, userUuidToRemove, survey }, client = db) =>
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
