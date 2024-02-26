import { ENV } from '@core/processUtils'

const arenaAppId = 'arena'
const arenaMobileId = 'arena-mobile'

const keys = {
  appId: 'appId',
  platform: 'platform',
  version: 'version',
}

const newAppInfo = ({ appId = arenaAppId, version = ENV.applicationVersion } = {}) => ({
  [keys.appId]: appId,
  [keys.version]: version,
})

export const AppInfo = {
  arenaAppId,
  arenaMobileId,
  keys,
  newAppInfo,
}
