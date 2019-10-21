import db from '../../../db/db';
import User from '../../../../core/user/user';
import AuthGroups from '../../../../core/auth/authGroups';
import UserRepository from '../repository/userRepository';
import AuthGroupRepository from '../../auth/repository/authGroupRepository';
import ActivityLog from '../../activityLog/activityLogger';

// ==== CREATE

const insertUser = async (user, surveyId, uuid, email, groupUuid, client: any = db) =>
  await client.tx(async t => {
    const newUser = await UserRepository.insertUser(surveyId, uuid, email, t)
    await addUserToGroup(user, surveyId, groupUuid, newUser, t)
  })

const addUserToGroup = async (user, surveyId, groupUuid, userToAdd, client: any = db) =>
  await client.tx(async t => {
    await AuthGroupRepository.insertUserGroup(groupUuid, User.getUuid(userToAdd), t)
    await ActivityLog.log(
      user,
      surveyId,
      ActivityLog.type.userInvite,
      { groupUuid, uuid: User.getUuid(userToAdd) },
      t
    )
  })

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

const fetchUsersBySurveyId = async (surveyId, offset, limit, fetchSystemAdmins, client: any = db) =>
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

const _updateUser = async (user, surveyId, userUuid, name, email, groupUuid, profilePicture, client: any = db) =>
  await client.tx(async t => {
    const newGroup = await AuthGroupRepository.fetchGroupByUuid(groupUuid)

    if (AuthGroups.isSystemAdminGroup(newGroup)) {
      // if new group is SystemAdmin, delete all user groups and set his new group to SystemAdmin
      await AuthGroupRepository.deleteAllUserGroups(userUuid, t)
      await AuthGroupRepository.insertUserGroup(groupUuid, userUuid, t)
    } else {
      await AuthGroupRepository.updateUserGroup(surveyId, userUuid, groupUuid, t)
    }

    await ActivityLog.log(
      user,
      surveyId,
      ActivityLog.type.userUpdate,
      { userUuid, name, email, groupUuid },
      t
    )

    return await UserRepository.updateUser(userUuid, name, email, profilePicture, t)
  })

const updateUser = _userFetcher(_updateUser)

// ==== DELETE

const deleteUser = async (user, surveyId, userUuidToRemove, client: any = db) =>
  await Promise.all([
    AuthGroupRepository.deleteUserGroup(surveyId, userUuidToRemove, client),
    ActivityLog.log(
      user, surveyId, ActivityLog.type.userRemove, { userUuid: userUuidToRemove }, client
    )
  ])

const updateUserPrefs = async user => ({
  ...await UserRepository.updateUserPrefs(user),
  [User.keys.authGroups]: await AuthGroupRepository.fetchUserGroups(User.getUuid(user))
})

export default {
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
};
