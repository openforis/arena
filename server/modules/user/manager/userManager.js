const db = require('@server/db/db')

const ActivityLog = require('@common/activityLog/activityLog')

const User = require('@core/user/user')
const AuthGroup = require('@core/auth/authGroup')

const ActivityLogRepository = require('@server/modules/activityLog/repository/activityLogRepository')
const AuthGroupRepository = require('@server/modules/auth/repository/authGroupRepository')
const UserRepository = require('@server/modules/user/repository/userRepository')

// ==== CREATE

const insertUser = async (user, surveyId, surveyCycleKey, uuid, email, groupUuid, client = db) =>
  await client.tx(async t => {
    const newUser = await UserRepository.insertUser(surveyId, surveyCycleKey, uuid, email, t)
    await addUserToGroup(user, surveyId, groupUuid, newUser, t)
  })

const addUserToGroup = async (user, surveyId, groupUuid, userToAdd, client = db) =>
  await client.tx(async t => await Promise.all([
    AuthGroupRepository.insertUserGroup(groupUuid, User.getUuid(userToAdd), t),
    ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.userInvite,
      {
        [ActivityLog.keysContent.uuid]: User.getUuid(userToAdd),
        [ActivityLog.keysContent.groupUuid]: groupUuid
      },
      false,
      t
    )
  ]))

// ==== READ

const _userFetcher = fetchFn => async (...args) => {
  const user = await fetchFn(...args)

  if (user) {
    const authGroups = await AuthGroupRepository.fetchUserGroups(User.getUuid(user))
    return { ...user, authGroups }
  }

  return null
}

const fetchUserByEmail = _userFetcher(UserRepository.fetchUserByEmail)

const fetchUserByUuid = _userFetcher(UserRepository.fetchUserByUuid)

const fetchUsersBySurveyId = async (surveyId, offset, limit, fetchSystemAdmins, client = db) =>
  await client.tx(async t => {
    const users = await UserRepository.fetchUsersBySurveyId(surveyId, offset, limit, fetchSystemAdmins, t)

    return await Promise.all(
      users.map(async u => ({
        ...u,
        authGroups: await AuthGroupRepository.fetchUserGroups(User.getUuid(u))
      }))
    )
  })

// ==== UPDATE

const _updateUser = async (user, surveyId, userUuid, name, email, groupUuid, profilePicture, client = db) =>
  await client.tx(async t => {
    const newGroup = await AuthGroupRepository.fetchGroupByUuid(groupUuid)

    if (AuthGroup.isSystemAdminGroup(newGroup)) {
      // if new group is SystemAdmin, delete all user groups and set his new group to SystemAdmin
      await AuthGroupRepository.deleteAllUserGroups(userUuid, t)
      await AuthGroupRepository.insertUserGroup(groupUuid, userUuid, t)
    } else {
      await AuthGroupRepository.updateUserGroup(surveyId, userUuid, groupUuid, t)
    }

    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.userUpdate,
      { [ActivityLog.keysContent.uuid]: userUuid, name, email, groupUuid },
      false,
      t
    )

    return await UserRepository.updateUser(userUuid, name, email, profilePicture, t)
  })

const updateUser = _userFetcher(_updateUser)

// ==== DELETE

const deleteUser = async (user, surveyId, userUuidToRemove, client = db) =>
  await client.tx(async t => {
    const userToRemove = await UserRepository.fetchUserByUuid(userUuidToRemove, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: userUuidToRemove,
      [ActivityLog.keysContent.userName]: User.getName(userToRemove)
    }
    return await Promise.all([
      AuthGroupRepository.deleteUserGroup(surveyId, userUuidToRemove, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.userRemove, logContent, false, t)
    ])
  })

const updateUserPrefs = async user => ({
  ...await UserRepository.updateUserPrefs(user),
  [User.keys.authGroups]: await AuthGroupRepository.fetchUserGroups(User.getUuid(user))
})

module.exports = {
  // CREATE
  insertUser,
  addUserToGroup,

  // READ
  fetchUsersBySurveyId,
  countUsersBySurveyId: UserRepository.countUsersBySurveyId,
  fetchUserByUuid,
  fetchUserByEmail,
  fetchUserProfilePicture: UserRepository.fetchUserProfilePicture,

  // UPDATE
  updateUser,
  updateUsername: UserRepository.updateUsername,
  updateUserPrefs,
  resetUsersPrefsSurveyCycle: UserRepository.resetUsersPrefsSurveyCycle,

  // DELETE
  deleteUser,
}
