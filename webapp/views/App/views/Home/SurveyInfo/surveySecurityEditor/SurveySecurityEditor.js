import './SurveySecurityEditor.scss'

import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import { surveySecurityDefaults, SurveySecurityProp } from '@openforis/arena-core'

import { Checkbox } from '@webapp/components/form'

const mobileSecurityProps = [
  SurveySecurityProp.allowRecordsDownloadInMobile,
  SurveySecurityProp.allowRecordsUploadFromMobile,
  SurveySecurityProp.allowRecordsWithErrorsUploadFromMobile,
]

const isSecurityPropEnabled = (key) => (security) => (security[key] ?? surveySecurityDefaults[key]) === true

const isSecurityPropApplicable = (key) => (security) => {
  const visibleInMobile = isSecurityPropEnabled(SurveySecurityProp.visibleInMobile)(security)
  if (!visibleInMobile) {
    return !mobileSecurityProps.includes(key)
  }
  if (key === SurveySecurityProp.allowRecordsWithErrorsUploadFromMobile) {
    return isSecurityPropEnabled(SurveySecurityProp.allowRecordsUploadFromMobile)(security)
  }
  return true
}

const deleteNotApplicableSecurityProps = (security) => {
  const propsToClean = mobileSecurityProps
  propsToClean.forEach((propToClean) => {
    if (!isSecurityPropApplicable(propToClean)(security)) {
      delete security[propToClean]
    }
  })
}

const deleteSecurityPropsEqualToDefault = (security) => {
  Object.keys(security).forEach((key) => {
    if (security[key] === surveySecurityDefaults[key]) {
      delete security[key]
    }
  })
}

export const SurveySecurityEditor = (props) => {
  const { security: securityProp, onSecurityUpdate } = props

  const security = useMemo(
    () => ({
      ...surveySecurityDefaults,
      ...(securityProp ?? {}),
    }),
    [securityProp]
  )

  const onPropUpdate = useCallback(
    (prop) => (value) => {
      const securityUpdated = { ...security, [prop]: value }
      deleteNotApplicableSecurityProps(securityUpdated)
      deleteSecurityPropsEqualToDefault(securityUpdated)
      onSecurityUpdate(securityUpdated)
    },
    [onSecurityUpdate, security]
  )

  const applicableSecurityPropKeys = useMemo(
    () => Object.values(SurveySecurityProp).filter((key) => isSecurityPropApplicable(key)(security)),
    [security]
  )

  return (
    <div className="survey-security-editor">
      {applicableSecurityPropKeys.map((key) => (
        <Checkbox
          key={key}
          checked={security[key]}
          disabled={!isSecurityPropApplicable(key)(security)}
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
