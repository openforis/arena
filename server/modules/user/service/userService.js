const UserManager = require('../manager/userManager')

const UserValidator = require('../../../../common/user/userValidator')

module.exports = {
  validateNewUser: UserValidator.validateNewUser,

  countUsersBySurveyId: UserManager.countUsersBySurveyId,

  fetchUsersBySurveyId: UserManager.fetchUsersBySurveyId,

  findUserById: UserManager.findUserById,

  fetchUserByCognitoUsername: UserManager.fetchUserByCognitoUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

  inviteUser: UserManager.inviteUser,
}