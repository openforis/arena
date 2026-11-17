import SystemError from '@core/systemError'
import { uuidv4 } from '@core/uuid'

const tokenInfoByToken = {}
const TOKEN_EXPIRATION = 48 * 60 * 60 * 1000 // 48h

export const generateRStudioToken = ({ chainUuid }: { chainUuid: string }) => {
  const token = uuidv4()
  tokenInfoByToken[token] = { chainUuid, createdAt: Date.now() }

  setTimeout(() => {
    delete tokenInfoByToken[token]
  }, TOKEN_EXPIRATION)

  return token
}

const isRStudioTokenValid = ({ token, chainUuid }: { token: any; chainUuid: string }) => {
  const tokenInfo = tokenInfoByToken[token]
  if (!tokenInfo) return false

  const { chainUuid: chainUuidSaved, createdAt } = tokenInfo

  if (chainUuidSaved !== chainUuid) return false

  return createdAt + TOKEN_EXPIRATION >= Date.now()
}

export const checkRStudioToken = ({ token, chainUuid }: { token: any; chainUuid: string }) => {
  if (!isRStudioTokenValid({ token, chainUuid })) {
    throw new SystemError('chain.error.invalidToken')
  }
}
