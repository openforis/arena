const UserManager = require('../manager/userManager')

module.exports = {

  findUserById: UserManager.findUserById,

  findUserByCognitoUsername: UserManager.findUserByCognitoUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,
}