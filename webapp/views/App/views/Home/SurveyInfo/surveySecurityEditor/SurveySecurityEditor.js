import './SurveySecurityEditor.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { SurveySecurity } from '@core/survey/surveySecurity'

import { Checkbox } from '@webapp/components/form'

const { keys } = SurveySecurity

export const SurveySecurityEditor = (props) => {
  const { security = SurveySecurity.getDefaults(), onSecurityUpdate } = props
  return (
    <div className="survey-security-editor">
      {Object.values(keys).map((key) => (
        <Checkbox
          key={key}
          checked={security[key]}
          label={`homeView.surveyInfo.security.${key}`}
          onChange={(value) => onSecurityUpdate({ ...security, [key]: value })}
        />
      ))}
    </div>
  )
}

SurveySecurityEditor.propTypes = {
  security: PropTypes.object,
  onSecurityUpdate: PropTypes.func.isRequired,
}
