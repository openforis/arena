import * as A from '@core/arena'

const keys = {
  deviceName: 'deviceName',
  enabled: 'enabled',
  dateCreated: 'dateCreated',
  dateModified: 'dateModified',
}

const getDeviceName = A.propOr('', keys.deviceName)
const isEnabled = (device) => A.propOr(false, keys.enabled, device)
const getDateCreated = A.propOr(null, keys.dateCreated)
const getDateModified = A.propOr(null, keys.dateModified)

export const UserTwoFactorDevice = {
  keys,
  getDeviceName,
  isEnabled,
  getDateCreated,
  getDateModified,
}
