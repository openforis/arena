import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import { UserTwoFactorDevice } from '@core/userTwoFactorDevice'

const validateDevice = async (device) =>
  Validator.validate(device, {
    [UserTwoFactorDevice.keys.deviceName]: [
      Validator.validateRequired(Validation.messageKeys.userTwoFactorDevice.nameRequired),
    ],
  })

export const UserTwoFactorDeviceValidator = {
  validateDevice,
}
