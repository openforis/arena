import React from 'react'
import { Checkbox } from '@webapp/components/form'

import { SurveySecurity } from '@core/survey/surveySecurity'

const { keys } = SurveySecurity

export const SurveySecurityEditor = (props) => {
  const { security, onSecurityUpdate } = props
  return (
    <div>
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
