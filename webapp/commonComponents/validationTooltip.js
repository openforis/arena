import React from 'react'

import * as ValidationUtils from '../utils/validationUtils'

import * as R from 'ramda'

import Tooltip from './tooltip'

import useI18n from '../commonComponents/useI18n'

export default ({ validation, children, className }) => {
  const i18n = useI18n()

  const messagesHtml = ValidationUtils.getValidationFieldMessagesHTML(i18n)(validation)
  const type = R.isEmpty(validation) ? '' : 'error'

  return (
    <Tooltip
      type={type}
      messages={messagesHtml}
      className={className}>
      {children}
    </Tooltip>
  )
}