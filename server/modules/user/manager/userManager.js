const db = require('../../../db/db')

const UserRepository = require('../repository/userRepository')
const AuthManager = require('../../auth/manager/authManager')

const User = require('../../../../common/user/user')

const ActivityLog = require('../../activityLog/activityLogger')

// ==== CREATE

const insertUser = async (user, surveyId, cognitoUsername, email, groupId, client = db) =>
  client.tx(async t => {
    const newUser = await UserRepository.insertUser(surveyId, cognitoUsername, email, t)
    const newUserId = User.getId(newUser)
    await ActivityLog.log(user, surveyId, ActivityLog.type.userInvite, { email, id: newUserId, cognitoUsername }, t)

    await AuthManager.insertUserGroup(user, surveyId, groupId, newUserId, t)

    return newUser
  })

// ==== READ

const _userFetcher = fetchFn => async (...args) => {
  const user = await fetchFn(...args)

  if (user) {
    const authGroups = await AuthManager.fetchUserGroups(user.id)
    return { ...user, authGroups }
  }

  return null
}

const fetchUserByEmail = _userFetcher(UserRepository.fetchUserByEmail)

const fetchUserByCognitoUsername = _userFetcher(UserRepository.fetchUserByCognitoUsername)

// ==== DELETE

const deleteUserPref = async (user, name) => ({
  ...(await UserRepository.deleteUserPref(user, name)),
  authGroups: await AuthManager.fetchUserGroups(user.id)
})

module.exports = {
  // CREATE
  insertUser,

  // READ
  fetchUsersBySurveyId: UserRepository.fetchUsersBySurveyId,

  countUsersBySurveyId: UserRepository.countUsersBySurveyId,

  fetchUserByCognitoUsername,

  fetchUserByEmail,

  // UPDATE
  updateUsername: UserRepository.updateUsername,

  updateUserPref: UserRepository.updateUserPref,

  // DELETE
  deleteUserPref,
}
