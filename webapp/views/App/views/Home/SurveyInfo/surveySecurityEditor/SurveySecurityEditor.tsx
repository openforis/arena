import './SurveySecurityEditor.scss'

import { Fragment, useCallback, useMemo } from 'react'

import { surveySecurityDefaults, SurveySecurityProp } from '@openforis/arena-core'

import { Alert } from '@webapp/components/Alert'
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

type SurveySecurityEditorProps = {
  security?: Record<string, any>
  onSecurityUpdate: (...args: any[]) => any
  keepNonApplicableValues?: boolean
  onKeepNonApplicableValuesUpdate?: (...args: any[]) => any
  notifyAdminsOnRecordsUploadFromMobile?: boolean
  onNotifyAdminsOnRecordsUploadFromMobileUpdate?: (...args: any[]) => any
  formPreviewForDataEntryUsers?: boolean
  onFormPreviewForDataEntryUsersUpdate?: (...args: any[]) => any
}

export const SurveySecurityEditor = (props: SurveySecurityEditorProps) => {
  const {
    security: securityProp,
    onSecurityUpdate,
    keepNonApplicableValues = false,
    onKeepNonApplicableValuesUpdate = null,
    notifyAdminsOnRecordsUploadFromMobile = false,
    onNotifyAdminsOnRecordsUploadFromMobileUpdate = null,
    formPreviewForDataEntryUsers = false,
    onFormPreviewForDataEntryUsersUpdate = null,
  } = props

  const security = useMemo(
    () => ({
      ...surveySecurityDefaults,
      ...securityProp,
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
      <Alert text="homeView:surveyInfo.security.publishToApply" />
      {applicableSecurityPropKeys.map((key) => (
        <Fragment key={key}>
          <Checkbox
            checked={security[key]}
            disabled={!isSecurityPropApplicable(key)(security)}
            label={`homeView:surveyInfo.security.${key}`}
            onChange={onPropUpdate(key)}
          />
          {/* shown together with the upload options: it is applicable only when records upload is allowed */}
          {key === SurveySecurityProp.allowRecordsWithErrorsUploadFromMobile &&
            onNotifyAdminsOnRecordsUploadFromMobileUpdate && (
              <Checkbox
                checked={Boolean(notifyAdminsOnRecordsUploadFromMobile)}
                info="homeView:surveyInfo.security.notifyAdminsOnRecordsUploadFromMobileInfo"
                label="homeView:surveyInfo.security.notifyAdminsOnRecordsUploadFromMobile"
                onChange={onNotifyAdminsOnRecordsUploadFromMobileUpdate}
              />
            )}
        </Fragment>
      ))}
      {onKeepNonApplicableValuesUpdate && (
        <Checkbox
          checked={Boolean(keepNonApplicableValues)}
          info="homeView:surveyInfo.keepNonApplicableValuesInfo"
          label="homeView:surveyInfo.keepNonApplicableValues"
          onChange={onKeepNonApplicableValuesUpdate}
        />
      )}
      {onFormPreviewForDataEntryUsersUpdate && (
        <Checkbox
          checked={Boolean(formPreviewForDataEntryUsers)}
          info="homeView:surveyInfo.security.formPreviewForDataEntryUsersInfo"
          label="homeView:surveyInfo.security.formPreviewForDataEntryUsers"
          onChange={onFormPreviewForDataEntryUsersUpdate}
        />
      )}
    </div>
  )
}
