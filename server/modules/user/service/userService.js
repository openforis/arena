const UserManager = require('../manager/userManager')

module.exports = {

  findUserById: UserManager.findUserById,

  findUserByEmailAndPassword: UserManager.findUserByEmailAndPassword,

  findUserByUsername: UserManager.findUserByUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

  blacklistTokenByJti: UserManager.blacklistTokenByJti,

  findBlacklistedTokenByJti: UserManager.findBlacklistedTokenByJti,

  deleteExpiredJwtTokens: UserManager.deleteExpiredJwtTokens,
}