import './SurveySecurityEditor.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { surveySecurityDefaults, SurveySecurityProp } from '@openforis/arena-core'

import { Checkbox } from '@webapp/components/form'

const isSecurityPropEditingEnabled = (key) => (security) => {
  const visibleInMobile = security[SurveySecurityProp.visibleInMobile] !== false
  return (
    visibleInMobile ||
    ![SurveySecurityProp.allowRecordsDownloadInMobile, SurveySecurityProp.allowRecordsUploadFromMobile].includes(key)
  )
}

const cleanupSecurity = (security) => {
  const securityUpdated = { ...security }
  const propsToClean = [
    SurveySecurityProp.allowRecordsDownloadInMobile,
    SurveySecurityProp.allowRecordsUploadFromMobile,
  ]
  propsToClean.forEach((propToClean) => {
    if (!isSecurityPropEditingEnabled(propToClean)(securityUpdated)) {
      delete securityUpdated[propToClean]
    }
  })
  return securityUpdated
}

export const SurveySecurityEditor = (props) => {
  const { security = surveySecurityDefaults, onSecurityUpdate } = props

  const onPropUpdate = useCallback(
    (prop) => (value) => {
      const securityUpdated = cleanupSecurity({ ...security, [prop]: value })
      onSecurityUpdate(securityUpdated)
    },
    [onSecurityUpdate, security]
  )

  return (
    <div className="survey-security-editor">
      {Object.values(SurveySecurityProp).map((key) => (
        <Checkbox
          key={key}
          checked={security[key]}
          disabled={!isSecurityPropEditingEnabled(key)(security)}
          label={`homeView.surveyInfo.security.${key}`}
          onChange={onPropUpdate(key)}
        />
      ))}
    </div>
  )
}

SurveySecurityEditor.propTypes = {
  security: PropTypes.object,
  onSecurityUpdate: PropTypes.func.isRequired,
}
