import * as A from '@core/arena'
import * as User from '@core/user/user'

const keys = {
  deviceName: 'deviceName',
  enabled: 'enabled',
  dateCreated: 'dateCreated',
  dateModified: 'dateModified',
  secret: 'secret',
  otpAuthUrl: 'otpAuthUrl',
  backupCodes: 'backupCodes',
  uuid: 'uuid',
}

const getUuid = A.prop(keys.uuid)
const getDeviceName = A.propOr('', keys.deviceName)
const isEnabled = (device) => A.propOr(false, keys.enabled, device)
const getDateCreated = A.propOr(null, keys.dateCreated)
const getDateModified = A.propOr(null, keys.dateModified)
const getSecret = A.propOr(null, keys.secret)
const getOtpAuthUrl = A.propOr(null, keys.otpAuthUrl)
const getBackupCodes = A.propOr([], keys.backupCodes)

// utils
const getDeviceNameFinal =
  ({ user }) =>
  (device) =>
    `Arena: ${getDeviceName(device)} - ${User.getEmail(user)}`

export const User2FADevice = {
  keys,
  getUuid,
  getDeviceName,
  isEnabled,
  getDateCreated,
  getDateModified,
  getSecret,
  getOtpAuthUrl,
  getBackupCodes,
  getDeviceNameFinal,
}
