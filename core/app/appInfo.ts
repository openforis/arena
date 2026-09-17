import * as A from '@core/arena'
import { ENV } from '@core/processUtils'

const arenaAppId = 'arena' // desktop app
const arenaMobileId = 'arena-mobile' // old mobile app version 1, deprecated
const arenaMobileExperimentsId = 'mam' // experimental mobile app
const arenaMobile2Id = 'am' // official mobile app

const appNameById: Record<string, string> = {
  [arenaAppId]: 'Arena',
  [arenaMobileId]: 'Arena Mobile',
  [arenaMobile2Id]: 'Arena Mobile',
  [arenaMobileExperimentsId]: 'Arena Mobile Experiments',
}

const keys = {
  appId: 'appId',
  platform: 'platform',
  version: 'version',
} as const

const currentAppInfo = {
  [keys.appId]: arenaAppId,
  [keys.version]: ENV.applicationVersion,
}

const getAppId = A.propOr(arenaAppId, keys.appId)

const getAppNameById = (appId: string): string => appNameById[appId] ?? appId

export const AppInfo = {
  arenaAppId,
  arenaMobileId,
  arenaMobile2Id,
  keys,
  currentAppInfo,
  getAppId,
  getAppNameById,
}
