import SystemError from '@core/systemError'
import { uuidv4 } from '@core/uuid'

const rstudioCodeTokens = {}
const EXPIRATION_RSTUDIO_TOKEN = 48 * 60 * 60 * 1000 // 48h

export const generateRStudioToken = ({ chainUuid }) => {
  const token = uuidv4()
  rstudioCodeTokens[token] = { chainUuid, createdAt: Date.now() }

  setTimeout(() => {
    delete rstudioCodeTokens[token]
  }, EXPIRATION_RSTUDIO_TOKEN)

  return token
}

const isRStudioTokenValid = ({ token, chainUuid }) => {
  const chain = rstudioCodeTokens[token]
  if (!chain) return false
  const { chainUuid: chainUuidSaved, createdAt } = chain
  if (chainUuidSaved !== chainUuid) return false
  if (createdAt + EXPIRATION_RSTUDIO_TOKEN < Date.now()) return false
  return true
}

export const checkRStudioToken = ({ token, chainUuid }) => {
  if (!isRStudioTokenValid({ token, chainUuid })) {
    throw new SystemError('chain.error.invalidToken')
  }
}
