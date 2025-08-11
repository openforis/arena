import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import { UserPasswordChangeForm } from './userPasswordChangeForm'
import { UserPasswordValidator } from './userPasswordValidator'

const getPropsValidations = ({ includeOldPassword = true } = {}) => {
  const validations = {
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
  }
  if (includeOldPassword) {
    validations[UserPasswordChangeForm.keys.oldPassword] = [
      Validator.validateRequired(Validation.messageKeys.userPasswordChange.oldPasswordRequired),
    ]
  }
  return validations
}

const validate = async (userPasswordChangeForm) => Validator.validate(userPasswordChangeForm, getPropsValidations())

export const UserPasswordChangeFormValidator = {
  getPropsValidations,
  validate,
}
