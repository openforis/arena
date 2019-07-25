const R = require('ramda')

const UserRepository = require('../repository/userRepository')
const AuthGroupRepository = require('../../auth/repository/authGroupRepository')

// ==== READ

const fetchUsersBySurveyId = async (surveyId, offset, limit) => {
  const users = await (UserRepository.fetchUsersBySurveyId(surveyId, offset, limit))

  // User is accepted if cognitoUsername is set
  return R.map(
    R.pipe(
      u => R.assoc('accepted', !!u.cognitoUsername)(u),
      R.dissoc('cognitoUsername')
    )
  )(users)
}

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
  fetchUsersBySurveyId,

  countUsersBySurveyId: UserRepository.countUsersBySurveyId,

  findUserByCognitoUsername,

  // UPDATE
  updateUserPref: UserRepository.updateUserPref,

  // DELETE
  deleteUserPref,
}
