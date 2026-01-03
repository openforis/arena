import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

export const validateMessage = async (message) =>
  Validator.validate(message, {
    ['props.subject']: [Validator.validateRequired(Validation.messageKeys.message.subjectRequired)],
    ['props.body']: [Validator.validateRequired(Validation.messageKeys.message.bodyRequired)],
    ['props.notificationTypes']: [Validator.validateRequired(Validation.messageKeys.message.notificationTypeRequired)],
    ['props.targets']: [Validator.validateRequired(Validation.messageKeys.message.targetsRequired)],
  })
