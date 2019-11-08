import * as Jwt from '@server/utils/jwt'

import * as AuthManager from '../manager/authManager'

export const blacklistToken = async token => {
  const expiration = Jwt.getExpiration(token)
  const jti = Jwt.getJti(token)

  await AuthManager.blacklistToken(jti, expiration)
}

export const findBlacklistedToken = AuthManager.findBlacklistedToken

export const deleteExpiredJwtTokens = AuthManager.deleteExpiredJwtTokens
