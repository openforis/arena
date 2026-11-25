import { type ArenaValidation, MessagePropsKey } from '@openforis/arena-core'

import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

export const validateMessage = async (message: Record<string, unknown>): Promise<ArenaValidation> =>
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
