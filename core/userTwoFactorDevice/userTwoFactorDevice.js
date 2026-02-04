import * as A from '@core/arena'

const keys = {
  deviceName: 'deviceName',
}

const getDeviceName = A.propOr('', keys.deviceName)

export const UserTwoFactorDevice = {
  keys,
  getDeviceName,
}
