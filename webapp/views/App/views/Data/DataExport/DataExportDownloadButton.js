import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { FileFormats } from '@core/fileFormats'
import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'
import * as JobSerialized from '@common/job/jobSerialized'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { useSurveyCycleKey, useSurveyId, useSurveyName } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import { TestId } from '@webapp/utils/testId'

export const DataExportDownloadButton = (props) => {
  const { job } = props

  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const surveyName = useSurveyName()
  const cycle = useSurveyCycleKey()

  const { exportUuid } = JobSerialized.getResult(job)

  const outputFileName = ExportFileNameGenerator.generate({
    surveyName,
    cycle,
    fileFormat: FileFormats.zip,
    fileType: 'DataExport',
    includeTimestamp: true,
  })

  const onClick = useCallback(() => dispatch(JobActions.hideJobMonitor()), [dispatch])

  return (
    <ButtonDownload
      testId={TestId.dataExport.downloadExportedFileBtn}
      fileName={outputFileName}
      href={API.downloadExportedDataUrl({ surveyId, cycle, exportUuid })}
      onClick={onClick}
      variant="contained"
    />
  )
}

DataExportDownloadButton.propTypes = {
  job: PropTypes.object.isRequired,
}
