import React from 'react'

import * as JobSerialized from '@common/job/jobSerialized'

import { ButtonDownload } from '@webapp/components/buttons'

import { SurveyState } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import { TestId } from '@webapp/utils/testId'
import * as API from '@webapp/service/api'

export const startCSVExport = (options) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  const job = await API.startExportDataToCSVJob({ surveyId, options })

  dispatch(
    JobActions.showJobMonitor({
      job,
      closeButton: (closeButtonProps) => {
        const { job: jobComplete } = closeButtonProps
        const { exportUuid } = JobSerialized.getResult(jobComplete)
        return (
          <ButtonDownload
            testId={TestId.dataExport.exportCSV}
            href={API.downloadExportedDataToCSVUrl({ surveyId, exportUuid })}
            onClick={() => dispatch(JobActions.hideJobMonitor())}
          />
        )
      },
    })
  )
}
