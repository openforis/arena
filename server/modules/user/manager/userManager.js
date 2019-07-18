const UserRepository = require('../repository/userRepository')
const AuthGroupRepository = require('../../auth/repository/authGroupRepository')

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
  // READ
  fetchUsersBySurveyId: UserRepository.fetchUsersBySurveyId,

  findUserByCognitoUsername,

  // UPDATE
  updateUserPref: UserRepository.updateUserPref,

  // DELETE
  deleteUserPref,
}
