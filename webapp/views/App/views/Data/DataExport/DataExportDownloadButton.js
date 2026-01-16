import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'
import { FileFormats } from '@core/fileFormats'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import { TestId } from '@webapp/utils/testId'

export const DataExportDownloadButton = (props) => {
  const { job } = props

  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const { downloadToken } = JobSerialized.getResult(job)

  const onClick = useCallback(() => dispatch(JobActions.hideJobMonitor()), [dispatch])

  return (
    <ButtonDownload
      testId={TestId.dataExport.downloadExportedFileBtn}
      downloadInMemory={false}
      href={API.downloadFileUrl({
        downloadToken,
        surveyId,
        cycle,
        fileType: 'DataExport',
        fileFormat: FileFormats.zip,
      })}
      onClick={onClick}
      variant="contained"
    />
  )
}

DataExportDownloadButton.propTypes = {
  job: PropTypes.object.isRequired,
}
