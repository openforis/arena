import React from 'react'

import * as ValidationUtils from '../utils/validationUtils'
import Validator from '../../common/validation/validator'

import * as R from 'ramda'

import Tooltip from './tooltip'

import useI18n from '../commonComponents/useI18n'

export default ({ validation, children, className }) => {
  const i18n = useI18n()

  const isValid = Validator.isValidationValid(validation)
  const type = isValid ? '' : 'error'
  const messagesHtml = isValid
    ? null
    : ValidationUtils.getValidationFieldMessagesHTML(i18n)(Validator.getFieldValidations(validation))

  return (
    <Tooltip
      type={type}
      messages={messagesHtml}
      className={className}>
      {children}
    </Tooltip>
  )
}