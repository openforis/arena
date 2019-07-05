const AuthManager = require('../manager/authManager')

module.exports = {
  blacklistToken: AuthManager.blacklistToken,

  findBlacklistedToken: AuthManager.findBlacklistedToken,

  deleteExpiredJwtTokens: AuthManager.deleteExpiredJwtTokens,
}