import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import { FileFormats } from '@core/fileFormats'

import { Button, ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'

const SchemaSummaryExportCloseButton = ({ job, surveyId, cycle, fileFormat }) => {
  const { tempFileName } = job.result
  const dispatch = useDispatch()

  const onDownload = useCallback(() => dispatch(JobActions.hideJobMonitor()), [dispatch])

  return (
    <ButtonDownload
      href={`/api/survey/${surveyId}/schema-summary/export/download`}
      requestParams={{ tempFileName, cycle, fileFormat }}
      onClick={onDownload}
      variant="contained"
    />
  )
}

SchemaSummaryExportCloseButton.propTypes = {
  job: PropTypes.object.isRequired,
  surveyId: PropTypes.number.isRequired,
  cycle: PropTypes.string.isRequired,
  fileFormat: PropTypes.string.isRequired,
}

const SurveySchemaSummaryDownloadButton = (props) => {
  const { className, fileFormat = FileFormats.xlsx, includeAiDescriptions = false, testId } = props

  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const dispatch = useDispatch()

  const onClickAi = useCallback(async () => {
    const { job } = await API.startSchemaSummaryExportJob({ surveyId, cycle, fileFormat, includeAiDescriptions: true })

    dispatch(
      JobActions.showJobMonitor({
        job,
        closeButton: ({ job: jobCompleted }) => (
          <SchemaSummaryExportCloseButton
            job={jobCompleted}
            surveyId={surveyId}
            cycle={cycle}
            fileFormat={fileFormat}
          />
        ),
      })
    )
  }, [cycle, dispatch, fileFormat, surveyId])

  const labelKey = includeAiDescriptions
    ? `surveyForm:schemaSummaryAiDescriptions_${fileFormat}`
    : `surveyForm:schemaSummary_${fileFormat}`

  if (includeAiDescriptions) {
    return (
      <Button
        className={className}
        iconClassName="icon-download2 icon-14px"
        testId={testId}
        onClick={onClickAi}
        label={labelKey}
        variant="text"
      />
    )
  }

  return (
    <ButtonDownload
      className={className}
      testId={testId}
      href={`/api/survey/${surveyId}/schema-summary`}
      requestParams={{ cycle, fileFormat }}
      label={labelKey}
      variant="text"
    />
  )
}

SurveySchemaSummaryDownloadButton.propTypes = {
  className: PropTypes.string,
  fileFormat: PropTypes.string,
  includeAiDescriptions: PropTypes.bool,
  testId: PropTypes.string,
}

export default SurveySchemaSummaryDownloadButton
