const AuthGroupRepository = require('../repository/authGroupRepository')
const JwtRepository = require('../repository/jwtRepository')

module.exports = {

  fetchGroupById: AuthGroupRepository.fetchGroupById,

  blacklistToken: JwtRepository.blacklistToken,

  findBlacklistedToken: JwtRepository.findBlacklistedToken,

  deleteExpiredJwtTokens: JwtRepository.deleteExpiredJwtTokens,
}