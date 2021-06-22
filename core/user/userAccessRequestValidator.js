import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

export const validateUserAccessRequest = async (userAccessRequest) =>
  Validator.validate(userAccessRequest, {
    [UserAccessRequest.keys.email]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequest.emailRequired),
      Validator.validateEmail({ errorKey: Validation.messageKeys.userAccessRequest.emailInvalid }),
    ],
    [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.firstName}`]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequest.firstNameRequired),
    ],
    [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.lastName}`]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequest.lastNameRequired),
    ],
  })
