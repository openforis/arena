import { ENV } from '@core/processUtils'

const arenaAppId = 'arena'
const arenaMobileId = 'arena-mobile'

const keys = {
  appId: 'appId',
  appVersion: 'appVersion',
}

const newAppInfo = ({ appId = arenaAppId, appVersion = ENV.applicationVersion } = {}) => ({
  [keys.appId]: appId,
  [keys.appVersion]: appVersion,
})

export const AppInfo = {
  arenaAppId,
  arenaMobileId,
  keys,
  newAppInfo,
}
