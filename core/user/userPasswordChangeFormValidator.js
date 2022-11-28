import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import { UserPasswordChangeForm } from './userPasswordChangeForm'
import { UserPasswordValidator } from './userPasswordValidator'

const validate = async (userPasswordChangeForm) =>
  Validator.validate(userPasswordChangeForm, {
    [UserPasswordChangeForm.keys.oldPassword]: [
      Validator.validateRequired(Validation.messageKeys.userPasswordChange.oldPasswordRequired),
    ],
    [UserPasswordChangeForm.keys.newPassword]: [
      Validator.validateRequired(Validation.messageKeys.userPasswordChange.newPasswordRequired),
      UserPasswordValidator.validatePassword,
    ],
    [UserPasswordChangeForm.keys.confirmPassword]: [
      Validator.validateRequired(Validation.messageKeys.userPasswordChange.confirmPasswordRequired),
      (propName, obj) => {
        const passwordRepeated = obj[propName]
        const newPassword = obj[UserPasswordChangeForm.keys.newPassword]
        return newPassword === passwordRepeated
          ? null
          : { key: Validation.messageKeys.userPasswordChange.confirmedPasswordNotMatching }
      },
    ],
  })

export const UserPasswordChangeFormValidator = {
  validate,
}
