import Jwt from '../../../utils/jwt';
import AuthManager from '../manager/authManager';

const blacklistToken = async token => {
  const expiration = Jwt.getExpiration(token)
  const jti = Jwt.getJti(token)

  await AuthManager.blacklistToken(jti, expiration)
}

export default {
  blacklistToken,

  findBlacklistedToken: AuthManager.findBlacklistedToken,

  deleteExpiredJwtTokens: AuthManager.deleteExpiredJwtTokens,
};
