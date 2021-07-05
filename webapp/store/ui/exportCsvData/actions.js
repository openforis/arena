import React from 'react'
import axios from 'axios'

import * as JobSerialized from '@common/job/jobSerialized'

import DownloadButton from '@webapp/components/form/downloadButton'

import { SurveyState } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import { DataTestId } from '@webapp/utils/dataTestId'

export const startCSVExport = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  const { data } = await axios.post(`/api/survey/${surveyId}/export-csv-data`)
  const { job } = data

  dispatch(
    JobActions.showJobMonitor({
      job,
      closeButton: (closeButtonProps) => {
        const { job: jobComplete } = closeButtonProps
        const { exportDataFolderName } = JobSerialized.getResult(jobComplete)
        return (
          <DownloadButton
            id={DataTestId.dataExport.exportCSV}
            href={`/api/survey/${surveyId}/export-csv-data/${exportDataFolderName}`}
            label="common.export"
            onClick={() => dispatch(JobActions.hideJobMonitor())}
          />
        )
      },
    })
  )
}
