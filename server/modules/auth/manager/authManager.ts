import AuthGroupRepository from '../repository/authGroupRepository';
import JwtRepository from '../repository/jwtRepository';

export default {

  fetchGroupByUuid: AuthGroupRepository.fetchGroupByUuid,

  blacklistToken: JwtRepository.blacklistToken,

  findBlacklistedToken: JwtRepository.findBlacklistedToken,

  deleteExpiredJwtTokens: JwtRepository.deleteExpiredJwtTokens,
};
