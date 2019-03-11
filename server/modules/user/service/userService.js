const UserManager = require('../persistence/userManager')

module.exports = {

  findUserById: UserManager.findUserById,

  findUserByEmailAndPassword: UserManager.findUserByEmailAndPassword,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

}