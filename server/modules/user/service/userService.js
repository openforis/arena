const UserManager = require('../manager/userManager')

module.exports = {

  findUserById: UserManager.findUserById,

  findUserByEmail: UserManager.findUserByEmail,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,
}