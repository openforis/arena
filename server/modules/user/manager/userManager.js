import * as R from 'ramda'

import { db } from '@server/db/db'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'
import * as Validation from '@core/validation/validation'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import * as UserResetPasswordRepository from '@server/modules/user/repository/userResetPasswordRepository'

export const {
  countUsersBySurveyId,
  fetchUserProfilePicture,
  updateNamePasswordAndStatus,
  resetUsersPrefsSurveyCycle,
  importNewUser,
} = UserRepository

export const {
  findUserUuidByUuid: findResetPasswordUserUuidByUuid,
  deleteUserResetPasswordByUuid,
  deleteUserResetPasswordExpired,
} = UserResetPasswordRepository

// ==== CREATE

export const addUserToGroup = async (user, surveyId, groupUuid, userToAdd, client = db) =>
  client.tx(async (t) => {
    await AuthGroupRepository.insertUserGroup(groupUuid, User.getUuid(userToAdd), t)
    const group = await AuthGroupRepository.fetchGroupByUuid(groupUuid, t)

    if (!AuthGroup.isSystemAdminGroup(group)) {
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

export const insertUser = async (
  { user, surveyId, surveyCycleKey, email, password, status, groupUuid, title },
  client = db
) =>
  client.tx(async (t) => {
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
    await addUserToGroup(user, surveyId, groupUuid, newUser, t)
    return newUser
  })

export const generateResetPasswordUuid = async (email, client = db) => {
  const user = await UserRepository.fetchUserByEmail(email, client)
  if (user) {
    const uuid = await UserResetPasswordRepository.insertOrUpdateResetPassword(User.getUuid(user), client)
    return { uuid, user }
  }

  throw new Error(Validation.messageKeys.user.emailNotFound)
}
// ==== READ

const _initializeUser = async (user) => {
  // Assoc auth groups
  let userUpdated = User.assocAuthGroups(await AuthGroupRepository.fetchUserGroups(User.getUuid(user)))(user)
  if (User.isInvited(userUpdated)) {
    const userUuid = User.getUuid(userUpdated)
    const invitationValid = await UserResetPasswordRepository.existsResetPasswordValidByUserUuid(userUuid)
    userUpdated = User.assocInvitationExpired(!invitationValid)(userUpdated)
  }

  return userUpdated
}

const _userFetcher = (fetchFn) => async (...args) => {
  const user = await fetchFn(...args)
  return user ? _initializeUser(user) : null
}

export const fetchUserByEmail = _userFetcher(UserRepository.fetchUserByEmail)

export const fetchUserByUuid = _userFetcher(UserRepository.fetchUserByUuid)
export const fetchUserByUuidWithPassword = _userFetcher(UserRepository.fetchUserByUuidWithPassword)

export const fetchUsersBySurveyId = async (surveyId, offset, limit, fetchSystemAdmins, client = db) =>
  client.tx(async (t) => {
    const users = await UserRepository.fetchUsersBySurveyId(surveyId, offset, limit, fetchSystemAdmins, t)
    return Promise.all(users.map(_initializeUser))
  })

export const findUserByEmailAndPassword = async (email, password, passwordCompareFn) => {
  const user = await UserRepository.fetchUserAndPasswordByEmail(email)

  if (user && (await passwordCompareFn(password, user.password))) return _initializeUser(R.dissoc('password', user))

  return null
}

// ==== UPDATE

const _updateUser = async (user, surveyId, userToUpdate, profilePicture, client = db) =>
  client.tx(async (t) => {
    const userUuid = User.getUuid(userToUpdate)
    const groupUuid = User.getGroupUuid(userToUpdate)
    const newGroup = await AuthGroupRepository.fetchGroupByUuid(groupUuid)

    if (AuthGroup.isSystemAdminGroup(newGroup)) {
      // If new group is SystemAdmin, delete all user groups and set his new group to SystemAdmin
      await AuthGroupRepository.deleteAllUserGroups(userUuid, t)
      await AuthGroupRepository.insertUserGroup(groupUuid, userUuid, t)
    } else {
      await AuthGroupRepository.updateUserGroup(surveyId, userUuid, groupUuid, t)
      // Log user update activity only for non system admin users
      await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.userUpdate, userToUpdate, false, t)
    }

    const name = User.getName(userToUpdate)
    const email = User.getEmail(userToUpdate)
    const props = User.getProps(userToUpdate)
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

export const updateUserPrefs = async (user) => ({
  ...(await UserRepository.updateUserPrefs(user)),
  [User.keys.authGroups]: await AuthGroupRepository.fetchUserGroups(User.getUuid(user)),
})

// ==== DELETE

export const deleteUser = async (user, surveyId, userUuidToRemove, client = db) =>
  client.tx(async (t) =>
    Promise.all([
      AuthGroupRepository.deleteUserGroup(surveyId, userUuidToRemove, t),
      ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.userRemove,
        { [ActivityLog.keysContent.uuid]: userUuidToRemove },
        false,
        t
      ),
    ])
  )
