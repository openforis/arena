import React from 'react'
import axios from 'axios'

import * as JobSerialized from '@common/job/jobSerialized'

import { ButtonDownload } from '@webapp/components/buttons'

import { SurveyState } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import { TestId } from '@webapp/utils/testId'

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
          <ButtonDownload
            testId={TestId.dataExport.exportCSV}
            href={`/api/survey/${surveyId}/export-csv-data/${exportDataFolderName}`}
            onClick={() => dispatch(JobActions.hideJobMonitor())}
          />
        )
      },
    })
  )
}
