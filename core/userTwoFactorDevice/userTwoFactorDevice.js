import * as A from '@core/arena'

const keys = {
  deviceName: 'deviceName',
  enabled: 'enabled',
  dateCreated: 'dateCreated',
  dateModified: 'dateModified',
  secret: 'secret',
  otpAuthUrl: 'otpAuthUrl',
  uuid: 'uuid',
}

const getUuid = A.prop(keys.uuid)
const getDeviceName = A.propOr('', keys.deviceName)
const isEnabled = (device) => A.propOr(false, keys.enabled, device)
const getDateCreated = A.propOr(null, keys.dateCreated)
const getDateModified = A.propOr(null, keys.dateModified)
const getSecret = A.propOr(null, keys.secret)
const getOtpAuthUrl = A.propOr(null, keys.otpAuthUrl)

export const UserTwoFactorDevice = {
  keys,
  getUuid,
  getDeviceName,
  isEnabled,
  getDateCreated,
  getDateModified,
  getSecret,
  getOtpAuthUrl,
}
