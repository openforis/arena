const UserManager = require('../manager/userManager')

module.exports = {
  countUsersBySurveyId: UserManager.countUsersBySurveyId,

  fetchUsersBySurveyId: UserManager.fetchUsersBySurveyId,

  findUserById: UserManager.findUserById,

  fetchUserByCognitoUsername: UserManager.fetchUserByCognitoUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

  inviteUser: UserManager.inviteUser,
}