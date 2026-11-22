import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import { UserPasswordValidator } from '@core/user/userPasswordValidator'

const validate = ({ email, password }: { email: string; password: string }) =>
  Validator.validate(
    { email, password },
    {
      email: [
        Validator.validateRequired(Validation.messageKeys.user.emailRequired),
        Validator.validateEmail({ errorKey: Validation.messageKeys.user.emailInvalid }),
      ],
      password: [
        Validator.validateRequired(Validation.messageKeys.user.passwordRequired),
        UserPasswordValidator.validatePassword,
      ],
    }
  )

export const SystemAdminUserValidator = {
  validate,
}
