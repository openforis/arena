const UserManager = require('../manager/userManager')

module.exports = {

  findUserById: UserManager.findUserById,

  findUserByEmailAndPassword: UserManager.findUserByEmailAndPassword,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

}