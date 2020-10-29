import { uuidv4 } from '@core/uuid'

const rstudioCodeTokens = {}
const EXPIRATION_RSTUDIO_TOKEN = 60 * 60 * 1000

export const generateRStudioToken = ({ chainUuid }) => {
  const token = uuidv4()
  rstudioCodeTokens[token] = { chainUuid, createdAt: new Date().getTime() }
  return token
}

export const checkRStudioToken = ({ token, chainUuid }) => {
  const chain = rstudioCodeTokens[token] || false
  if (!chain) return false
  const { chainUuid: chainUuidSaved, createdAt } = chain
  if (chainUuidSaved !== chainUuid) return false
  if (createdAt + EXPIRATION_RSTUDIO_TOKEN < new Date().getTime()) return false
  return true
}
