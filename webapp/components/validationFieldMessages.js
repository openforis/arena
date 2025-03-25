import './validationFieldMessages.scss'

import React from 'react'

import { ValidationUtils } from '@core/validation/validationUtils'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import Markdown from '@webapp/components/markdown'

const ValidationFieldMessages = (props) => {
  const {
    validation = null,
    showKeys = true, // Show the key of the fields' validations
    showIcons = false, // Show error or warning icon
  } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const messages = ValidationUtils.getJointMessages({ i18n, survey, showKeys })(validation)

  return (
    <div className="validation-field_messages">
      {messages.map(({ severity, text }, i) => (
        <div className={`validation-field_message ${severity}`} key={i}>
          {showIcons && <span className="icon icon-warning icon-12px icon-left" />}
          <Markdown className="validation-field-message__text" source={text} />
        </div>
      ))}
    </div>
  )
}

export default ValidationFieldMessages
