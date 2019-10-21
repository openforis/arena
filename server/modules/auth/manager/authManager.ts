const AuthGroupRepository = require('../repository/authGroupRepository')
const JwtRepository = require('../repository/jwtRepository')

module.exports = {

  fetchGroupByUuid: AuthGroupRepository.fetchGroupByUuid,

  blacklistToken: JwtRepository.blacklistToken,

  findBlacklistedToken: JwtRepository.findBlacklistedToken,

  deleteExpiredJwtTokens: JwtRepository.deleteExpiredJwtTokens,
}