import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import { FileFormats } from '@core/fileFormats'

import { Button, ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'

const SurveySchemaSummaryDownloadButton = (props) => {
  const { className, fileFormat = FileFormats.xlsx, testId } = props

  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const dispatch = useDispatch()

  const onClick = useCallback(async () => {
    const { job } = await API.startSchemaSummaryExportJob({ surveyId, cycle, fileFormat })

    dispatch(
      JobActions.showJobMonitor({
        job,
        closeButton: ({ job: jobCompleted }) => {
          const { tempFileName } = jobCompleted.result
          return (
            <ButtonDownload
              href={`/api/survey/${surveyId}/schema-summary/export/download`}
              requestParams={{ tempFileName, cycle, fileFormat }}
              onClick={() => dispatch(JobActions.hideJobMonitor())}
              variant="contained"
            />
          )
        },
      })
    )
  }, [cycle, dispatch, fileFormat, surveyId])

  return (
    <Button
      className={className}
      testId={testId}
      onClick={onClick}
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
