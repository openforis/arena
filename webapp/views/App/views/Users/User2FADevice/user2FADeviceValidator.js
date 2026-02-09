import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import { User2FADevice } from '@core/user2FADevice'

const validateDevice = (existingDevices) => async (device) =>
  Validator.validate(device, {
    [User2FADevice.keys.deviceName]: [
      Validator.validateRequired(Validation.messageKeys.user2FADevice.nameRequired),
      Validator.validateItemPropUniqueness(Validation.messageKeys.user2FADevice.nameDuplicate)(existingDevices),
    ],
  })

export const User2FADeviceValidator = {
  validateDevice,
}
