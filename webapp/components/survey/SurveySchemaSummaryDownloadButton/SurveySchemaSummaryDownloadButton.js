import React from 'react'
import PropTypes from 'prop-types'

import { FileFormats } from '@core/fileFormats'

import { ButtonDownload } from '@webapp/components/buttons'
import { useSurveyId, useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'
import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

const SurveySchemaSummaryDownloadButton = (props) => {
  const { className, fileFormat = FileFormats.xlsx, testId } = props

  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const survey = useSurveyInfo()
  const fileName = ExportFileNameGenerator.generate({
    survey,
    cycle,
    fileType: 'SchemaSummary',
    fileFormat,
  })

  return (
    <ButtonDownload
      className={className}
      fileName={fileName}
      testId={testId}
      href={`/api/survey/${surveyId}/schema-summary/`}
      requestParams={{ cycle, fileFormat }}
      label={`surveyForm:schemaSummary_${fileFormat}`}
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
