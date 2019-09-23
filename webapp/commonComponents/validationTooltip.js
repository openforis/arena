import React from 'react'

import * as ValidationUtils from '../utils/validationUtils'
import Validation from '../../common/validation/validation'

import Tooltip from './tooltip'

import useI18n from '../commonComponents/useI18n'

export default ({ validation, className, showKeys, children }) => {
  const i18n = useI18n()

  const isValid = Validation.isValid(validation)

  const type = isValid
    ? ''
    : Validation.hasWarnings(validation) || Validation.hasWarningsInFields(validation)
      ? 'warning'
      : 'error'

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