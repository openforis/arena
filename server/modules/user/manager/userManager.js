const R = require('ramda')

const db = require('../../../db/db')

const UserRepository = require('../repository/userRepository')
const AuthGroupRepository = require('../../auth/repository/authGroupRepository')

// ==== CREATE

const inviteUser = async (surveyId, email, groupId, client = db) => {
  const user = await UserRepository.insertUser(surveyId, email, groupId, client)
  await AuthGroupRepository.insertUserGroup(groupId, user.id, client)
}

// ==== READ

const findUserByCognitoUsername = async email => {
  const user = await UserRepository.findUserByCognitoUsername(email)

  if (user) {
    const authGroups = await AuthGroupRepository.fetchUserGroups(user.id)
    return { ...user, authGroups }
  }

  return null
}

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

  findUserByCognitoUsername,

  // UPDATE
  updateUserPref: UserRepository.updateUserPref,

  // DELETE
  deleteUserPref,
}
