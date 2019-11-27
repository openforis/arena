import React from 'react'

import * as ValidationUtils from '@webapp/utils/validationUtils'
import * as Validation from '@core/validation/validation'

import Tooltip from './tooltip'

import {useI18n} from './hooks'

export default ({validation, className, showKeys, children}) => {
  const i18n = useI18n()

  const isValid = Validation.isValid(validation)

  const type = isValid
    ? ''
    : (Validation.isWarning(validation)
      ? 'warning'
      : 'error')

  const messagesHtml = isValid
    ? null
    : ValidationUtils.getValidationFieldMessagesHTML(i18n, showKeys)(validation)

  return (
    <Tooltip
      type={type}
      messages={messagesHtml}
      className={className}>
      {children}
    </Tooltip>
  )
}
