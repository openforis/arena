import * as UserAccessRequestAccept from '@core/user/userAccessRequestAccept'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

const validateSurveyNameUniqueness = (surveyInfosWithSameName) => (_propName, _item) =>
  surveyInfosWithSameName && surveyInfosWithSameName.length > 0 ? { key: Validation.messageKeys.nameDuplicate } : null

export const validateUserAccessRequestAccept = async ({ accessRequestAccept, surveyInfosWithSameName = [] }) =>
  Validator.validate(accessRequestAccept, {
    [UserAccessRequestAccept.keys.email]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequestAccept.emailRequired),
      Validator.validateEmail({ errorKey: Validation.messageKeys.userAccessRequestAccept.emailInvalid }),
    ],
    [UserAccessRequestAccept.keys.role]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequestAccept.roleRequired),
    ],
    [UserAccessRequestAccept.keys.surveyName]: [
      Validator.validateRequired(Validation.messageKeys.userAccessRequestAccept.surveyNameRequired),
      Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfosWithSameName),
    ],
  })
