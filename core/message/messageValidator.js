import { MessagePropsKey } from '@openforis/arena-core'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

export const validateMessage = async (message) =>
  Validator.validate(message, {
    [`props.${MessagePropsKey.subject}`]: [Validator.validateRequired(Validation.messageKeys.message.subjectRequired)],
    [`props.${MessagePropsKey.body}`]: [Validator.validateRequired(Validation.messageKeys.message.bodyRequired)],
    [`props.${MessagePropsKey.notificationTypes}`]: [
      Validator.validateRequired(Validation.messageKeys.message.notificationTypeRequired),
    ],
    [`props.${MessagePropsKey.targetUserTypes}`]: [
      Validator.validateRequired(Validation.messageKeys.message.targetsRequired),
    ],
  })
