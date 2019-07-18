const UserManager = require('../manager/userManager')

module.exports = {
  fetchUsersBySurveyId: UserManager.fetchUsersBySurveyId,

  findUserById: UserManager.findUserById,

  findUserByCognitoUsername: UserManager.findUserByCognitoUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,
}