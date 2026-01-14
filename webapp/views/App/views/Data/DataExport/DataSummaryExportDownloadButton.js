import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import { TestId } from '@webapp/utils/testId'

export const DataSummaryExportDownloadButton = (props) => {
  const { job } = props

  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const { exportUuid } = JobSerialized.getResult(job)

  const onClick = useCallback(() => dispatch(JobActions.hideJobMonitor()), [dispatch])

  return (
    <ButtonDownload
      testId={TestId.dataExport.downloadExportedFileBtn}
      href={API.downloadExportedDataSummaryUrl({ surveyId, cycle, exportUuid })}
      onClick={onClick}
      variant="contained"
    />
  )
}

DataSummaryExportDownloadButton.propTypes = {
  job: PropTypes.object.isRequired,
}
