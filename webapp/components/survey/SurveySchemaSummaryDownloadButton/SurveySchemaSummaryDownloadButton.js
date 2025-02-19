import React from 'react'
import PropTypes from 'prop-types'

import { FileFormats } from '@core/fileFormats'

import { ButtonDownload } from '@webapp/components/buttons'
import { useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'

const SurveySchemaSummaryDownloadButton = (props) => {
  const { className, fileFormat = FileFormats.xlsx, testId } = props

  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  return (
    <ButtonDownload
      className={className}
      testId={testId}
      href={`/api/survey/${surveyId}/schema-summary/`}
      requestParams={{ cycle: surveyCycleKey, fileFormat }}
      label={fileFormat === FileFormats.csv ? 'surveyForm.schemaSummaryCsv' : 'surveyForm.schemaSummaryExcel'}
      variant="text"
    />
  )
}

SurveySchemaSummaryDownloadButton.propTypes = {
  className: PropTypes.string,
  fileFormat: PropTypes.string,
  testId: PropTypes.string,
}

export default SurveySchemaSummaryDownloadButton
