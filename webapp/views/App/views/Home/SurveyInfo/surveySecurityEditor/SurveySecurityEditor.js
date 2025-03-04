import './SurveySecurityEditor.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { surveySecurityDefaults, SurveySecurityProp } from '@openforis/arena-core'

import { Checkbox } from '@webapp/components/form'

export const SurveySecurityEditor = (props) => {
  const { security = surveySecurityDefaults, onSecurityUpdate } = props

  const onPropUpdate = useCallback(
    (prop) => (value) => {
      onSecurityUpdate({ ...security, [prop]: value })
    },
    [onSecurityUpdate, security]
  )

  return (
    <div className="survey-security-editor">
      {Object.values(SurveySecurityProp).map((key) => (
        <Checkbox
          key={key}
          checked={security[key]}
          label={`homeView.surveyInfo.security.${key}`}
          onChange={onPropUpdate}
        />
      ))}
    </div>
  )
}

SurveySecurityEditor.propTypes = {
  security: PropTypes.object,
  onSecurityUpdate: PropTypes.func.isRequired,
}
