import * as SurveyValidator from '@core/survey/surveyValidator'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

export const validateUserAccessRequest = async (userAccessRequest: Record<string, unknown>) =>
  Validator.validate(userAccessRequest, {
    [UserAccessRequest.keys.email]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequest.emailRequired),
      Validator.validateEmail({ errorKey: Validation.messageKeys.userAccessRequest.emailInvalid }),
    ],
    [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.title}`]: [
      Validator.validateRequired(Validation.messageKeys.user.titleRequired),
    ],
    [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.firstName}`]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequest.firstNameRequired),
    ],
    [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.lastName}`]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequest.lastNameRequired),
    ],
    [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.country}`]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequest.countryRequired),
    ],
    [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.institution}`]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequest.institutionRequired),
    ],
    [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.purpose}`]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequest.purposeRequired),
    ],
    [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.surveyName}`]:
      SurveyValidator.getSurveyNameValidations(),
  })
