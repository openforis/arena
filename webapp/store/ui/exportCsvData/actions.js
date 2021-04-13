import axios from 'axios'

import { SurveyState } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import * as JobSerialized from '@common/job/jobSerialized'

export const exportCsvDataUrlUpdate = 'exportCsvData/update'
export const updateExportCsvDataUrl = (exportCsvDataUrl) => (dispatch) =>
  dispatch({ type: exportCsvDataUrlUpdate, exportCsvDataUrl })

export const startCSVExport = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  const { data } = await axios.post(`/api/survey/${surveyId}/export-csv-data`)

  dispatch(
    JobActions.showJobMonitor({
      job: data.job,
      onComplete: async (job) => {
        const { exportDataFolderName } = JobSerialized.getResult(job)
        await dispatch(updateExportCsvDataUrl(exportDataFolderName))
      },
    })
  )
}
