import * as A from '@core/arena'
import { ENV } from '@core/processUtils'

const arenaAppId = 'arena'
const arenaMobileId = 'arena-mobile'
const arenaMobileExperimentsId = 'mam'
const arenaMobile2Id = 'am'

const appNameById: Record<string, string> = {
  [arenaAppId]: 'Arena',
  [arenaMobileId]: 'Arena Mobile',
  [arenaMobile2Id]: 'Arena Mobile 2',
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
