import React from 'react'

import * as ValidationUtils from '../utils/validationUtils'

import * as R from 'ramda'

import Tooltip from './tooltip'

import useI18n from '../commonComponents/useI18n'

export default ({ validation, children, className, type = '' }) => {
  const i18n = useI18n()

  const messagesHtml = ValidationUtils.getValidationFieldMessagesHTML(i18n)(validation)

  return (
    <Tooltip
      type={type}
      messages={messagesHtml}
      className={className}>
      {children}
    </Tooltip>
  )
}