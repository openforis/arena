import * as A from '@core/arena'
import { ENV } from '@core/processUtils'

const arenaAppId = 'arena'
const arenaMobileId = 'arena-mobile'

const appNameById = {
  [arenaAppId]: 'Arena',
  [arenaMobileId]: 'Arena Mobile',
}

const keys = {
  appId: 'appId',
  platform: 'platform',
  version: 'version',
}

const newAppInfo = ({ appId = arenaAppId, version = ENV.applicationVersion } = {}) => ({
  [keys.appId]: appId,
  [keys.version]: version,
})

const getAppId = A.propOr(arenaAppId, keys.appId)

const getAppNameById = (appId) => appNameById[appId] ?? appId

export const AppInfo = {
  arenaAppId,
  arenaMobileId,
  keys,
  newAppInfo,
  getAppId,
  getAppNameById,
}
