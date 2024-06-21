import React from 'react'
import PropTypes from 'prop-types'

import { ButtonDownload } from '@webapp/components/buttons'
import { useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

const SurveySchemaSummaryDownloadButton = (props) => {
  const { className } = props

  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  return (
    <ButtonDownload
      className={className}
      testId={TestId.surveyForm.schemaSummary}
      href={`/api/survey/${surveyId}/schema-summary/`}
      requestParams={{ cycle: surveyCycleKey }}
      label="surveyForm.schemaSummary"
      title="surveyForm.schemaSummaryTitle"
      variant="text"
    />
  )
}

SurveySchemaSummaryDownloadButton.propTypes = {
  className: PropTypes.string,
}

export default SurveySchemaSummaryDownloadButton
