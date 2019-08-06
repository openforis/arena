const Jwt = require('../jwt')
const AuthManager = require('../manager/authManager')

const blacklistToken = async token => {
  const expiration = Jwt.getExpiration(token)
  const jti = Jwt.getJti(token)

  await AuthManager.blacklistToken(jti, expiration)
}

module.exports = {
  blacklistToken,

  findBlacklistedToken: AuthManager.findBlacklistedToken,

  deleteExpiredJwtTokens: AuthManager.deleteExpiredJwtTokens,
}