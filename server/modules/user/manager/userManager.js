const aws = require('../../../system/aws')

const db = require('../../../db/db')

const UserRepository = require('../repository/userRepository')
const AuthGroupRepository = require('../../auth/repository/authGroupRepository')

// ==== CREATE

const inviteUser = async (surveyId, email, groupId, client = db) =>
  client.tx(async t => {
    const user = await UserRepository.insertUser(surveyId, email, groupId, t)
    await AuthGroupRepository.insertUserGroup(groupId, user.id, t)

    // Rolls back the transaction if reject
    return aws.inviteUser(email)
  })

// ==== READ

const _userFetcher = fetchFn => async (...args) => {
  const user = await fetchFn(...args)

  if (user) {
    const authGroups = await AuthGroupRepository.fetchUserGroups(user.id)
    return { ...user, authGroups }
  }

  return null
}

const fetchUserByEmail = _userFetcher(UserRepository.fetchUserByEmail)

const fetchUserByCognitoUsername = _userFetcher(UserRepository.fetchUserByCognitoUsername)

// ==== DELETE

const deleteUserPref = async (user, name) => ({
  ...(await UserRepository.deleteUserPref(user, name)),
  authGroups: await AuthGroupRepository.fetchUserGroups(user.id)
})

module.exports = {
  // CREATE
  inviteUser,

  // READ
  fetchUsersBySurveyId: UserRepository.fetchUsersBySurveyId,

  countUsersBySurveyId: UserRepository.countUsersBySurveyId,

  fetchUserByCognitoUsername,

  fetchUserByEmail,

  // UPDATE
  updateUserPref: UserRepository.updateUserPref,

  // DELETE
  deleteUserPref,
}
