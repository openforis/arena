import * as A from '@core/arena'

const stateKey = 'user2fa'

const getState = A.propOr({}, stateKey)

// ====== READ
const getDevice = getState

export const UserTwoFactorDeviceState = {
  stateKey,
  getState,
  getDevice,
}
