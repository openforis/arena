import * as AuthGroupRepository from '../repository/authGroupRepository'
import * as JwtRepository from '../repository/jwtRepository'

export const fetchGroupByUuid = AuthGroupRepository.fetchGroupByUuid

export const blacklistToken = JwtRepository.blacklistToken

export const findBlacklistedToken = JwtRepository.findBlacklistedToken

export const deleteExpiredJwtTokens = JwtRepository.deleteExpiredJwtTokens
