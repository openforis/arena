const JwtRepository = require('../repository/jwtRepository')

module.exports = {
  blacklistToken: JwtRepository.blacklistToken,

  findBlacklistedToken: JwtRepository.findBlacklistedToken,

  deleteExpiredJwtTokens: JwtRepository.deleteExpiredJwtTokens,
}