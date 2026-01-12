import * as A from '@core/arena'
import { ENV } from '@core/processUtils'

const arenaAppId = 'arena'
const arenaMobileId = 'arena-mobile'
const arenaMobileExperimentsId = 'mam'
const arenaMobile2Id = 'am'

const appNameById = {
  [arenaAppId]: 'Arena',
  [arenaMobileId]: 'Arena Mobile',
  [arenaMobile2Id]: 'Arena Mobile 2',
  [arenaMobileExperimentsId]: 'Arena Mobile Experiments',
}

const keys = {
  appId: 'appId',
  platform: 'platform',
  version: 'version',
}

const currentAppInfo = {
  [keys.appId]: arenaAppId,
  [keys.version]: ENV.applicationVersion,
}

const getAppId = A.propOr(arenaAppId, keys.appId)

const getAppNameById = (appId) => appNameById[appId] ?? appId

export const AppInfo = {
  arenaAppId,
  arenaMobileId,
  arenaMobile2Id,
  keys,
  currentAppInfo,
  getAppId,
  getAppNameById,
}
